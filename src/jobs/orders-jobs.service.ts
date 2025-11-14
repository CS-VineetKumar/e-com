import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, QueueEvents, Worker, JobsOptions } from 'bullmq';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

type InventoryJobData = {
  orderId: number;
};

type OrderConfirmationJobData = {
  orderId: number;
};

@Injectable()
export class OrdersJobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrdersJobsService.name);
  private readonly connection;
  private readonly inventoryQueue: Queue<InventoryJobData>;
  private readonly orderConfirmationQueue: Queue<OrderConfirmationJobData>;
  private readonly inventoryWorker: Worker<InventoryJobData>;
  private readonly orderConfirmationWorker: Worker<OrderConfirmationJobData>;
  private readonly inventoryEvents: QueueEvents;
  private readonly orderEvents: QueueEvents;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.connection = {
      host: this.configService.get<string>('REDIS_HOST') || '127.0.0.1',
      port: Number(this.configService.get<string>('REDIS_PORT') || 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
    };

    this.inventoryQueue = new Queue<InventoryJobData>(
      'inventory-adjustments',
      {
        connection: this.connection,
      },
    );

    this.orderConfirmationQueue = new Queue<OrderConfirmationJobData>(
      'order-confirmations',
      {
        connection: this.connection,
      },
    );

    this.inventoryWorker = new Worker<InventoryJobData>(
      'inventory-adjustments',
      (job) => this.handleInventoryAdjustment(job),
      {
        connection: this.connection,
      },
    );

    this.orderConfirmationWorker = new Worker<OrderConfirmationJobData>(
      'order-confirmations',
      (job) => this.handleOrderConfirmation(job),
      {
        connection: this.connection,
      },
    );

    this.inventoryEvents = new QueueEvents('inventory-adjustments', {
      connection: this.connection,
    });

    this.orderEvents = new QueueEvents('order-confirmations', {
      connection: this.connection,
    });
  }

  async onModuleInit() {
    await Promise.all([
      this.inventoryEvents.waitUntilReady(),
      this.orderEvents.waitUntilReady(),
    ]);

    this.inventoryEvents.on('completed', (event) => {
      const returnValue =
        (event.returnvalue as { orderId?: number } | null | undefined) ?? null;
      const orderId = returnValue?.orderId ?? 'unknown';
      this.logger.log(
        `Inventory job ${event.jobId} completed for order ${orderId}`,
      );
    });

    this.inventoryEvents.on('failed', (event) => {
      this.logger.error(
        `Inventory job ${event.jobId} failed: ${event.failedReason}`,
      );
    });

    this.orderEvents.on('completed', (event) => {
      this.logger.log(
        `Order confirmation job ${event.jobId} completed`,
      );
    });

    this.orderEvents.on('failed', (event) => {
      this.logger.error(
        `Order confirmation job ${event.jobId} failed: ${event.failedReason}`,
      );
    });
  }

  async onModuleDestroy() {
    await Promise.all([
      this.inventoryWorker.close(),
      this.orderConfirmationWorker.close(),
      this.inventoryQueue.close(),
      this.orderConfirmationQueue.close(),
      this.inventoryEvents.close(),
      this.orderEvents.close(),
    ]);
  }

  async enqueueInventoryAdjustment(orderId: number) {
    const options: JobsOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    };

    await this.inventoryQueue.add(
      'inventory-adjustment',
      { orderId },
      options,
    );
  }

  async enqueueOrderConfirmation(orderId: number) {
    const options: JobsOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    };

    await this.orderConfirmationQueue.add(
      'order-confirmation',
      { orderId },
      options,
    );
  }

  async cancelPendingJobs(orderId: number) {
    await Promise.all([
      this.removeJobsForOrder(this.inventoryQueue, orderId),
      this.removeJobsForOrder(this.orderConfirmationQueue, orderId),
    ]);
  }

  private async removeJobsForOrder<T extends { orderId: number }>(
    queue: Queue<T>,
    orderId: number,
  ) {
    const jobs = await queue.getJobs([
      'waiting',
      'delayed',
      'paused',
      'waiting-children',
    ]);

    await Promise.all(
      jobs
        .filter((job) => job.data.orderId === orderId)
        .map((job) => job.remove()),
    );
  }

  private async handleInventoryAdjustment(job: Job<InventoryJobData>) {
    const { orderId } = job.data;

    const orderWithItems = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    if (!orderWithItems) {
      throw new Error(`Order ${orderId} not found for inventory adjustment`);
    }

    await this.prisma.$transaction(
      orderWithItems.orderItems.map((orderItem) =>
        this.prisma.product.update({
          where: { id: orderItem.productId },
          data: {
            stock: {
              decrement: orderItem.quantity,
            },
          },
        }),
      ),
    );

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
      },
    });

    // Chain the confirmation email job once inventory adjusts successfully
    await this.enqueueOrderConfirmation(orderId);

    return { orderId };
  }

  private async handleOrderConfirmation(
    job: Job<OrderConfirmationJobData>,
  ) {
    const { orderId } = job.data;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found for confirmation processing`);
    }

    // Simulate sending confirmation email and auditing
    this.logger.log(
      `Sending order confirmation email to ${order.user.email} for order ${order.id}`,
    );

    return { orderId };
  }
}


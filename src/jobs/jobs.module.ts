import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersJobsService } from './orders-jobs.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [OrdersJobsService],
  exports: [OrdersJobsService],
})
export class JobsModule {}


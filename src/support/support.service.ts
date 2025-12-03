import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { Ticket, TicketStatus, TicketComment } from '@prisma/client';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(userId: number, createTicketDto: CreateTicketDto): Promise<Ticket> {
    // Validate order exists if orderId is provided
    if (createTicketDto.orderId) {
      const order = await this.prisma.order.findFirst({
        where: { id: createTicketDto.orderId, userId },
      });
      if (!order) {
        throw new NotFoundException('Order not found or does not belong to you');
      }
    }

    // Validate product exists if productId is provided
    if (createTicketDto.productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: createTicketDto.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }
    }

    return this.prisma.ticket.create({
      data: {
        ...createTicketDto,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        order: true,
        product: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async findAll(userRole: Role, userId?: number) {
    // Admin and Support Agents can see all tickets
    if (userRole === Role.ADMIN || userRole === Role.SUPPORT_AGENT) {
      return this.prisma.ticket.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          order: true,
          product: true,
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Customers and Sellers can only see their own tickets
    return this.prisma.ticket.findMany({
      where: {
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        order: true,
        product: true,
        comments: {
          where: {
            isInternal: false, // Hide internal comments from customers
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(ticketId: number, userId: number, userRole: Role): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        order: true,
        product: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check access permissions
    if (
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPPORT_AGENT &&
      ticket.createdById !== userId &&
      ticket.assignedToId !== userId
    ) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    // Filter internal comments for non-staff users
    if (userRole === Role.CUSTOMER || userRole === Role.SELLER) {
      ticket.comments = ticket.comments.filter(comment => !comment.isInternal);
    }

    return ticket;
  }

  async updateTicket(
    ticketId: number,
    updateTicketDto: UpdateTicketDto,
    userId: number,
    userRole: Role,
  ): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Only admin, support agents, and ticket creator can update
    if (
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPPORT_AGENT &&
      ticket.createdById !== userId
    ) {
      throw new ForbiddenException('You do not have permission to update this ticket');
    }

    // Customers can only update title and description
    if (userRole === Role.CUSTOMER || userRole === Role.SELLER) {
      if (updateTicketDto.status || updateTicketDto.assignedToId) {
        throw new ForbiddenException('You can only update title and description');
      }
    }

    // Handle status changes
    const updateData: any = { ...updateTicketDto };
    
    if (updateTicketDto.status === TicketStatus.CLOSED && !ticket.closedAt) {
      updateData.closedAt = new Date();
    } else if (updateTicketDto.status !== TicketStatus.CLOSED && ticket.closedAt) {
      updateData.closedAt = null;
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        order: true,
        product: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async assignTicket(
    ticketId: number,
    assignTicketDto: AssignTicketDto,
  ): Promise<Ticket> {
    // Verify the ticket exists
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Verify the assignee exists and has support agent or admin role
    const assignee = await this.prisma.user.findUnique({
      where: { id: assignTicketDto.assignedToId },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    if (assignee.role !== Role.SUPPORT_AGENT && assignee.role !== Role.ADMIN) {
      throw new BadRequestException('Can only assign tickets to support agents or admins');
    }

    // Update ticket assignment and status
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToId: assignTicketDto.assignedToId,
        status: ticket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : ticket.status,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        order: true,
        product: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async addComment(
    ticketId: number,
    createCommentDto: CreateCommentDto,
    userId: number,
    userRole: Role,
  ): Promise<TicketComment> {
    // Verify ticket exists and user has access
    const ticket = await this.findOne(ticketId, userId, userRole);

    // Only support agents and admins can add internal comments
    if (createCommentDto.isInternal && 
        userRole !== Role.SUPPORT_AGENT && 
        userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only support agents and admins can add internal comments');
    }

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        userId,
        comment: createCommentDto.comment,
        isInternal: createCommentDto.isInternal || false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Update ticket status based on who is commenting
    if (userRole === Role.CUSTOMER || userRole === Role.SELLER) {
      if (ticket.status === TicketStatus.WAITING_FOR_CUSTOMER) {
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.WAITING_FOR_AGENT },
        });
      }
    } else if (userRole === Role.SUPPORT_AGENT || userRole === Role.ADMIN) {
      if (ticket.status === TicketStatus.WAITING_FOR_AGENT || ticket.status === TicketStatus.OPEN) {
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.WAITING_FOR_CUSTOMER },
        });
      }
    }

    return comment;
  }

  async getMyAssignedTickets(userId: number) {
    return this.prisma.ticket.findMany({
      where: {
        assignedToId: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        order: true,
        product: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteTicket(ticketId: number, userId: number, userRole: Role): Promise<void> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Only admin or ticket creator can delete
    if (userRole !== Role.ADMIN && ticket.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to delete this ticket');
    }

    await this.prisma.ticket.delete({
      where: { id: ticketId },
    });
  }
}


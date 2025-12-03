import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { SupportService } from '../support.service';
import { TicketObject, TicketCommentObject } from './ticket.object';
import { CreateTicketInput } from './dto/create-ticket.input';
import { UpdateTicketInput } from './dto/update-ticket.input';
import { CreateCommentInput } from './dto/create-comment.input';
import { AssignTicketInput } from './dto/assign-ticket.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GraphQLCacheInterceptor } from '../../cache/graphql-cache.interceptor';

@Resolver(() => TicketObject)
@UseInterceptors(GraphQLCacheInterceptor)
export class SupportResolver {
  constructor(private readonly supportService: SupportService) {}

  @Query(() => [TicketObject], { name: 'tickets' })
  @UseGuards(JwtAuthGuard)
  async findAll(@Context() context: { req: { user: { userId: number; role: Role } } }): Promise<TicketObject[]> {
    const userId = context.req.user.userId;
    const userRole = context.req.user.role;
    return this.supportService.findAll(userRole, userId);
  }

  @Query(() => [TicketObject], { name: 'myAssignedTickets' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPPORT_AGENT, Role.ADMIN)
  async getMyAssignedTickets(@Context() context: { req: { user: { userId: number } } }): Promise<TicketObject[]> {
    const userId = context.req.user.userId;
    return this.supportService.getMyAssignedTickets(userId);
  }

  @Query(() => TicketObject, { name: 'ticket' })
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: { req: { user: { userId: number; role: Role } } },
  ): Promise<TicketObject> {
    const userId = context.req.user.userId;
    const userRole = context.req.user.role;
    return this.supportService.findOne(id, userId, userRole);
  }

  @Mutation(() => TicketObject)
  @UseGuards(JwtAuthGuard)
  async createTicket(
    @Args('input') createTicketInput: CreateTicketInput,
    @Context() context: { req: { user: { userId: number } } },
  ): Promise<TicketObject> {
    const userId = context.req.user.userId;
    return this.supportService.createTicket(userId, createTicketInput);
  }

  @Mutation(() => TicketObject)
  @UseGuards(JwtAuthGuard)
  async updateTicket(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') updateTicketInput: UpdateTicketInput,
    @Context() context: { req: { user: { userId: number; role: Role } } },
  ): Promise<TicketObject> {
    const userId = context.req.user.userId;
    const userRole = context.req.user.role;
    return this.supportService.updateTicket(id, updateTicketInput, userId, userRole);
  }

  @Mutation(() => TicketObject)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT_AGENT)
  async assignTicket(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') assignTicketInput: AssignTicketInput,
  ): Promise<TicketObject> {
    return this.supportService.assignTicket(id, assignTicketInput);
  }

  @Mutation(() => TicketCommentObject)
  @UseGuards(JwtAuthGuard)
  async addTicketComment(
    @Args('ticketId', { type: () => Int }) ticketId: number,
    @Args('input') createCommentInput: CreateCommentInput,
    @Context() context: { req: { user: { userId: number; role: Role } } },
  ): Promise<TicketCommentObject> {
    const userId = context.req.user.userId;
    const userRole = context.req.user.role;
    return this.supportService.addComment(ticketId, createCommentInput, userId, userRole);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteTicket(
    @Args('id', { type: () => Int }) id: number,
    @Context() context: { req: { user: { userId: number; role: Role } } },
  ): Promise<boolean> {
    const userId = context.req.user.userId;
    const userRole = context.req.user.role;
    await this.supportService.deleteTicket(id, userId, userRole);
    return true;
  }
}


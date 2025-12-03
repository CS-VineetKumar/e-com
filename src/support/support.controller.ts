import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import type { User } from '@prisma/client';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() createTicketDto: CreateTicketDto) {
    return this.supportService.createTicket(user.id, createTicketDto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.supportService.findAll(user.role, user.id);
  }

  @Get('assigned')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPPORT_AGENT, Role.ADMIN)
  getMyAssignedTickets(@CurrentUser() user: User) {
    return this.supportService.getMyAssignedTickets(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.supportService.findOne(id, user.id, user.role);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.supportService.updateTicket(id, updateTicketDto, user.id, user.role);
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT_AGENT)
  assignTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignTicketDto: AssignTicketDto,
  ) {
    return this.supportService.assignTicket(id, assignTicketDto);
  }

  @Post(':id/comments')
  addComment(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.supportService.addComment(id, createCommentDto, user.id, user.role);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.supportService.deleteTicket(id, user.id, user.role);
  }
}


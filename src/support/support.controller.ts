import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  create(@Request() req, @Body() createTicketDto: CreateTicketDto) {
    return this.supportService.createTicket(req.user.userId, createTicketDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.supportService.findAll(req.user.role, req.user.userId);
  }

  @Get('assigned')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPPORT_AGENT, Role.ADMIN)
  getMyAssignedTickets(@Request() req) {
    return this.supportService.getMyAssignedTickets(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.supportService.findOne(+id, req.user.userId, req.user.role);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.supportService.updateTicket(
      +id,
      updateTicketDto,
      req.user.userId,
      req.user.role,
    );
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT_AGENT)
  assignTicket(@Param('id') id: string, @Body() assignTicketDto: AssignTicketDto) {
    return this.supportService.assignTicket(+id, assignTicketDto);
  }

  @Post(':id/comments')
  addComment(
    @Request() req,
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.supportService.addComment(
      +id,
      createCommentDto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.supportService.deleteTicket(+id, req.user.userId, req.user.role);
  }
}


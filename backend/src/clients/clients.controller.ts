import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('clientes')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryClientDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Perfil.ADMIN)
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}

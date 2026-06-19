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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('veiculos')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // Cadastro/edição restritos a ADMIN e VENDEDOR
  @Post()
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  create(@Body() dto: CreateVehicleDto, @CurrentUser() user: AuthUser) {
    return this.vehiclesService.create(dto, user);
  }

  // Leitura liberada a qualquer perfil autenticado (escopo por filial aplicado no service)
  @Get()
  findAll(@Query() query: QueryVehicleDto, @CurrentUser() user: AuthUser) {
    return this.vehiclesService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Perfil.ADMIN)
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}

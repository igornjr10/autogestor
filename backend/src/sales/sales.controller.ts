import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('vendas')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: AuthUser) {
    return this.salesService.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('veiculoId') veiculoId?: string,
    @Query('filialId') filialId?: string,
  ) {
    if (veiculoId) {
      return this.salesService.findByVeiculo(veiculoId);
    }
    return this.salesService.findAll(user, filialId);
  }
}

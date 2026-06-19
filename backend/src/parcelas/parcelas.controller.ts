import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Perfil, StatusParcela } from '@prisma/client';
import { ParcelasService } from './parcelas.service';
import { CreateParcelaDto, UpdateParcelaDto } from './dto/parcela.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('parcelas')
export class ParcelasController {
  constructor(private readonly service: ParcelasService) {}

  @Post()
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR)
  create(@Body() dto: CreateParcelaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('vendaId') vendaId?: string,
    @Query('status') status?: StatusParcela,
  ) {
    return this.service.findAll({ vendaId, status });
  }

  @Get('resumo')
  resumo() {
    return this.service.resumo();
  }

  @Get('vencidas')
  vencidas() {
    return this.service.findVencidas();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(Perfil.ADMIN, Perfil.VENDEDOR, Perfil.FINANCEIRO)
  update(@Param('id') id: string, @Body() dto: UpdateParcelaDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/pagar')
  @Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
  marcarPago(@Param('id') id: string) {
    return this.service.marcarPago(id);
  }

  @Delete(':id')
  @Roles(Perfil.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { FiliaisService } from './filiais.service';
import { CreateFilialDto, UpdateFilialDto } from './dto/filial.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('filiais')
export class FiliaisController {
  constructor(private readonly filiaisService: FiliaisService) {}

  // Leitura liberada a qualquer perfil autenticado (para seletores/filtros)
  @Get()
  findAll() {
    return this.filiaisService.findAll();
  }

  @Post()
  @Roles(Perfil.ADMIN)
  create(@Body() dto: CreateFilialDto) {
    return this.filiaisService.create(dto);
  }

  @Patch(':id')
  @Roles(Perfil.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateFilialDto) {
    return this.filiaisService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Perfil.ADMIN)
  remove(@Param('id') id: string, @Query('force') force?: string) {
    return this.filiaisService.remove(id, force === 'true');
  }
}

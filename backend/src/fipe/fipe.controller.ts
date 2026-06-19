import { Controller, Get, Query } from '@nestjs/common';
import { FipeService } from './fipe.service';

@Controller('fipe')
export class FipeController {
  constructor(private readonly fipe: FipeService) {}

  @Get('marcas')
  marcas(@Query('tipo') tipo = 'carros') {
    return this.fipe.marcas(tipo);
  }

  @Get('modelos')
  modelos(@Query('tipo') tipo = 'carros', @Query('marca') marca: string) {
    return this.fipe.modelos(tipo, marca);
  }

  @Get('anos')
  anos(@Query('tipo') tipo = 'carros', @Query('marca') marca: string, @Query('modelo') modelo: string) {
    return this.fipe.anos(tipo, marca, modelo);
  }

  @Get('preco')
  preco(
    @Query('tipo') tipo = 'carros',
    @Query('marca') marca: string,
    @Query('modelo') modelo: string,
    @Query('ano') ano: string,
  ) {
    return this.fipe.preco(tipo, marca, modelo, ano);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { CashflowService } from './cashflow.service';
import { CreateLancamentoDto } from './dto/create-lancamento.dto';
import { QueryLancamentoDto } from './dto/query-lancamento.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('caixa')
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
export class CashflowController {
  constructor(private readonly cashflowService: CashflowService) {}

  @Get('categorias')
  categorias() {
    return this.cashflowService.categorias();
  }

  @Get('saldo')
  saldo(@CurrentUser() user: AuthUser, @Query('filialId') filialId?: string) {
    return this.cashflowService.saldoAtual(user, filialId);
  }

  @Get('resumo')
  resumo(@Query() query: QueryLancamentoDto, @CurrentUser() user: AuthUser) {
    return this.cashflowService.resumo(query, user);
  }

  @Get('lancamentos')
  findAll(@Query() query: QueryLancamentoDto, @CurrentUser() user: AuthUser) {
    return this.cashflowService.findAll(query, user);
  }

  @Post('lancamentos')
  create(@Body() dto: CreateLancamentoDto, @CurrentUser() user: AuthUser) {
    return this.cashflowService.create(dto, user);
  }

  @Delete('lancamentos/:id')
  remove(@Param('id') id: string) {
    return this.cashflowService.remove(id);
  }
}

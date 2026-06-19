import { Body, Controller, Get, Post } from '@nestjs/common';
import { Perfil } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('notificacoes')
@Roles(Perfil.ADMIN, Perfil.FINANCEIRO)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** Status da conexão com a Datafy API / WhatsApp. */
  @Get('status')
  status() {
    return this.notifications.status();
  }

  /** Log das mensagens enviadas (RF-05). */
  @Get()
  listar() {
    return this.notifications.listar();
  }

  /** Dispara manualmente a verificação de veículos parados há +60 dias. */
  @Post('verificar-estoque')
  verificarEstoque() {
    return this.notifications.verificarEstoque60Dias();
  }

  /** Dispara alertas para documentos com status PENDENTE. */
  @Post('verificar-documentos')
  verificarDocumentos() {
    return this.notifications.verificarDocumentosPendentes();
  }

  /** Dispara alertas para parcelas vencidas e próximas a vencer (3 dias). */
  @Post('verificar-parcelas')
  verificarParcelas() {
    return this.notifications.verificarParcelasVencidas();
  }

  /** Envia uma mensagem de teste para validar a conexão com a Datafy API. */
  @Post('teste')
  @Roles(Perfil.ADMIN)
  teste(@Body('telefone') telefone: string) {
    return this.notifications.enviarTeste(telefone);
  }
}

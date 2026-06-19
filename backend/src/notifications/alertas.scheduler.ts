import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

/**
 * Agendamento automático dos alertas (RF-05). Por padrão roda diariamente
 * às 8h (horário do servidor). Desative com ALERTAS_CRON_ENABLED=false.
 * O horário pode ser ajustado com ALERTAS_CRON (expressão cron).
 */
@Injectable()
export class AlertasScheduler {
  private readonly logger = new Logger('AlertasScheduler');

  constructor(
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  private get habilitado() {
    return this.config.get<string>('ALERTAS_CRON_ENABLED', 'true') !== 'false';
  }

  // Diário às 08:00 (servidor). Cobre estoque parado, documentos e parcelas.
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'alertas-diarios' })
  async alertasDiarios() {
    if (!this.habilitado) return;
    this.logger.log('Executando alertas diários...');
    try {
      const estoque = await this.notifications.verificarEstoque60Dias();
      const docs = await this.notifications.verificarDocumentosPendentes();
      const parcelas = await this.notifications.verificarParcelasVencidas();
      this.logger.log(
        `Alertas: estoque=${estoque.veiculosAlertados}, ` +
          `documentos=${docs.documentosAlertados}, ` +
          `parcelas=${(parcelas as any)?.parcelasAlertadas ?? '-'}`,
      );
    } catch (e: any) {
      this.logger.error(`Falha nos alertas diários: ${e?.message}`);
    }
  }
}

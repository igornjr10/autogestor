import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { BackupService } from './backup.service';

@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger('BackupScheduler');

  constructor(
    private readonly backup: BackupService,
    private readonly config: ConfigService,
  ) {}

  private get habilitado() {
    return this.config.get<string>('BACKUP_ENABLED', 'true') !== 'false';
  }

  // Todo dia às 02:00 da manhã
  @Cron('0 2 * * *', { name: 'backup-diario' })
  async backupDiario() {
    if (!this.habilitado) return;
    this.logger.log('Iniciando backup automático diário...');
    try {
      const r = await this.backup.executar();
      this.logger.log(`Backup automático concluído: ${r.arquivo} (${(r.tamanhoBytes / 1024).toFixed(1)} KB)`);
    } catch (e: any) {
      this.logger.error(`Falha no backup automático: ${e?.message}`);
    }
  }
}

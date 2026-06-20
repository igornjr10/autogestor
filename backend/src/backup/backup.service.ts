import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger('BackupService');
  private readonly dir = process.env.BACKUP_DIR ?? '/app/backups';
  private readonly retencao: number;

  constructor(private readonly config: ConfigService) {
    this.retencao = parseInt(this.config.get('BACKUP_RETENTION_DAYS', '7'), 10);
    fs.mkdirSync(this.dir, { recursive: true });
  }

  async executar(): Promise<{ arquivo: string; tamanhoBytes: number; duracaoMs: number }> {
    const dbUrl = this.resolverUrl();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const arquivo = path.join(this.dir, `backup_${timestamp}.sql.gz`);

    const t0 = Date.now();
    try {
      await execAsync(`pg_dump "${dbUrl}" | gzip > "${arquivo}"`);
    } catch (e: any) {
      // remove arquivo parcial se criado
      if (fs.existsSync(arquivo)) fs.unlinkSync(arquivo);
      throw new Error(`pg_dump falhou: ${e?.message ?? e}`);
    }

    const { size } = fs.statSync(arquivo);
    const duracaoMs = Date.now() - t0;
    this.logger.log(`Backup OK → ${path.basename(arquivo)} (${(size / 1024).toFixed(1)} KB, ${duracaoMs}ms)`);

    this.limparAntigos();
    return { arquivo: path.basename(arquivo), tamanhoBytes: size, duracaoMs };
  }

  listar(): { nome: string; tamanhoBytes: number; criadoEm: string }[] {
    if (!fs.existsSync(this.dir)) return [];
    return fs
      .readdirSync(this.dir)
      .filter((f) => f.endsWith('.sql.gz'))
      .map((f) => {
        const stat = fs.statSync(path.join(this.dir, f));
        return { nome: f, tamanhoBytes: stat.size, criadoEm: stat.mtime.toISOString() };
      })
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  caminho(nome: string): string {
    if (!nome.endsWith('.sql.gz') || nome.includes('/') || nome.includes('..')) {
      throw new Error('Nome de arquivo inválido.');
    }
    const p = path.join(this.dir, nome);
    if (!fs.existsSync(p)) throw new Error('Arquivo não encontrado.');
    return p;
  }

  private limparAntigos(): void {
    const limite = Date.now() - this.retencao * 24 * 60 * 60 * 1000;
    this.listar()
      .filter((f) => new Date(f.criadoEm).getTime() < limite)
      .forEach((f) => {
        fs.unlinkSync(path.join(this.dir, f.nome));
        this.logger.log(`Backup antigo removido: ${f.nome}`);
      });
  }

  private resolverUrl(): string {
    const url = this.config.get<string>('DIRECT_URL') ?? this.config.get<string>('DATABASE_URL') ?? '';
    if (!url) throw new Error('DATABASE_URL / DIRECT_URL não configurada.');
    // remove parâmetros que o pg_dump não suporta (pgbouncer, schema)
    try {
      const u = new URL(url);
      u.search = '';
      return u.toString();
    } catch {
      return url;
    }
  }
}

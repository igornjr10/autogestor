import { Controller, Get, Post, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { Perfil } from '@prisma/client';
import * as fs from 'fs';
import { BackupService } from './backup.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('backup')
@Roles(Perfil.ADMIN)
export class BackupController {
  constructor(private readonly backup: BackupService) {}

  /** Dispara backup manual imediato. */
  @Post('executar')
  executar() {
    return this.backup.executar();
  }

  /** Lista todos os arquivos de backup disponíveis. */
  @Get('listar')
  listar() {
    return this.backup.listar();
  }

  /** Download do arquivo de backup (.sql.gz). */
  @Get(':nome/download')
  download(@Param('nome') nome: string, @Res() res: Response) {
    const caminho = this.backup.caminho(nome);
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.setHeader('Content-Type', 'application/gzip');
    fs.createReadStream(caminho).pipe(res);
  }
}

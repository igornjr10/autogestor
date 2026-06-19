import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Perfil } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { uploadOptions } from './upload.config';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('documentos')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles(Perfil.ADMIN, Perfil.DOCUMENTAL, Perfil.VENDEDOR)
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryDocumentDto) {
    return this.documentsService.findAll(query);
  }

  @Patch(':id')
  @Roles(Perfil.ADMIN, Perfil.DOCUMENTAL)
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Post(':id/arquivo')
  @Roles(Perfil.ADMIN, Perfil.DOCUMENTAL, Perfil.VENDEDOR)
  @UseInterceptors(FileInterceptor('arquivo', uploadOptions))
  upload(@Param('id') id: string, @UploadedFile() arquivo: Express.Multer.File) {
    return this.documentsService.attachFile(id, arquivo);
  }

  @Get(':id/arquivo')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { caminho, nome, mimeType } = await this.documentsService.getArquivo(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(nome)}"`);
    res.sendFile(caminho);
  }

  @Delete(':id')
  @Roles(Perfil.ADMIN, Perfil.DOCUMENTAL)
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  /** Geração do Contrato de Compra e Venda em PDF (RF-07). */
  @Get('contrato/:veiculoId')
  async contrato(
    @Param('veiculoId') veiculoId: string,
    @Query('cidade') cidade: string | undefined,
    @Res() res: Response,
  ) {
    const pdf = await this.documentsService.gerarContrato(veiculoId, cidade);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="contrato-${veiculoId}.pdf"`);
    res.end(pdf);
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StatusDocumento } from '@prisma/client';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: PdfService,
  ) {}

  create(dto: CreateDocumentDto) {
    return this.prisma.documento.create({
      data: {
        tipo: dto.tipo,
        observacoes: dto.observacoes,
        veiculoId: dto.veiculoId,
        clienteId: dto.clienteId,
        status: StatusDocumento.PENDENTE,
      },
    });
  }

  findAll(query: QueryDocumentDto) {
    const where: Prisma.DocumentoWhereInput = {};
    if (query.veiculoId) where.veiculoId = query.veiculoId;
    if (query.clienteId) where.clienteId = query.clienteId;
    if (query.status) where.status = query.status;
    return this.prisma.documento.findMany({ where, orderBy: { criadoEm: 'desc' } });
  }

  async findOne(id: string) {
    const doc = await this.prisma.documento.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento não encontrado.');
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    await this.findOne(id);
    return this.prisma.documento.update({ where: { id }, data: dto });
  }

  /** Anexa o arquivo enviado e marca como RECEBIDO. */
  async attachFile(id: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo não enviado.');
    const doc = await this.findOne(id);
    // Remove arquivo anterior, se houver
    this.apagarArquivo(doc.caminho);
    return this.prisma.documento.update({
      where: { id },
      data: {
        nomeArquivo: file.originalname,
        caminho: file.path,
        mimeType: file.mimetype,
        tamanho: file.size,
        status: StatusDocumento.RECEBIDO,
      },
    });
  }

  async remove(id: string) {
    const doc = await this.findOne(id);
    this.apagarArquivo(doc.caminho);
    await this.prisma.documento.delete({ where: { id } });
    return { removido: true };
  }

  /** Caminho físico do arquivo para download. */
  async getArquivo(id: string) {
    const doc = await this.findOne(id);
    if (!doc.caminho || !fs.existsSync(doc.caminho)) {
      throw new NotFoundException('Este documento não possui arquivo anexado.');
    }
    return { caminho: doc.caminho, nome: doc.nomeArquivo ?? 'documento', mimeType: doc.mimeType ?? 'application/octet-stream' };
  }

  /** Gera o contrato de compra e venda (RF-07) a partir da venda do veículo. */
  async gerarContrato(veiculoId: string, cidade?: string) {
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: veiculoId },
      include: { venda: { include: { comprador: true } } },
    });
    if (!veiculo) throw new NotFoundException('Veículo não encontrado.');
    if (!veiculo.venda) {
      throw new BadRequestException('O veículo ainda não foi vendido. Registre a venda antes de gerar o contrato.');
    }

    const v = veiculo.venda;
    return this.pdf.gerarContrato({
      vendedorLoja: 'A LOJA (Revenda de Veículos)',
      veiculo: {
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        anoFabricacao: veiculo.anoFabricacao,
        anoModelo: veiculo.anoModelo,
        placa: veiculo.placa,
        chassi: veiculo.chassi,
        renavam: veiculo.renavam ?? '',
        cor: veiculo.cor,
        quilometragem: veiculo.quilometragem,
      },
      comprador: {
        nome: v.comprador.nome,
        cpfCnpj: v.comprador.cpfCnpj,
        endereco: v.comprador.endereco,
      },
      valor: Number(v.valorTotal),
      formaPagamento: v.formaPagamento,
      data: v.dataVenda,
      cidade,
    });
  }

  private apagarArquivo(caminho?: string | null) {
    if (caminho && fs.existsSync(caminho)) {
      try {
        fs.unlinkSync(caminho);
      } catch {
        /* ignora falha ao apagar arquivo físico */
      }
    }
  }
}

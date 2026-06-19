import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    await this.ensureCpfUnico(dto.cpfCnpj);
    return this.prisma.cliente.create({
      data: {
        ...dto,
        dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
      },
    });
  }

  findAll(query: QueryClientDto) {
    const where: Prisma.ClienteWhereInput = {};
    if (query.tipo) where.tipo = query.tipo;
    if (query.busca) {
      where.OR = [
        { nome: { contains: query.busca, mode: 'insensitive' } },
        { cpfCnpj: { contains: query.busca, mode: 'insensitive' } },
        { email: { contains: query.busca, mode: 'insensitive' } },
      ];
    }
    return this.prisma.cliente.findMany({ where, orderBy: { nome: 'asc' } });
  }

  /** Detalhe com histórico de compras (RF-06). */
  async findOne(id: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: {
        compras: {
          orderBy: { dataVenda: 'desc' },
          include: {
            veiculo: { select: { id: true, marca: true, modelo: true, placa: true } },
            vendedor: { select: { id: true, nome: true } },
          },
        },
      },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return {
      ...cliente,
      compras: cliente.compras.map((v) => ({
        id: v.id,
        dataVenda: v.dataVenda,
        valorTotal: Number(v.valorTotal),
        formaPagamento: v.formaPagamento,
        veiculo: v.veiculo,
        vendedor: v.vendedor,
      })),
    };
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensureExists(id);
    if (dto.cpfCnpj) {
      await this.ensureCpfUnico(dto.cpfCnpj, id);
    }
    return this.prisma.cliente.update({
      where: { id },
      data: {
        ...dto,
        dataNascimento: dto.dataNascimento ? new Date(dto.dataNascimento) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    const vendas = await this.prisma.venda.count({ where: { compradorId: id } });
    if (vendas > 0) {
      throw new ConflictException('Não é possível excluir um cliente com vendas vinculadas.');
    }
    await this.prisma.cliente.delete({ where: { id } });
    return { removido: true };
  }

  private async ensureExists(id: string) {
    const existe = await this.prisma.cliente.findUnique({ where: { id }, select: { id: true } });
    if (!existe) {
      throw new NotFoundException('Cliente não encontrado.');
    }
  }

  private async ensureCpfUnico(cpfCnpj: string, ignorarId?: string) {
    const existente = await this.prisma.cliente.findUnique({ where: { cpfCnpj } });
    if (existente && existente.id !== ignorarId) {
      throw new ConflictException('Já existe um cliente com este CPF/CNPJ.');
    }
  }
}

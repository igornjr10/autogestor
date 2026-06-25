import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SituacaoVeiculo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { filialWhere } from '../common/filial-scope';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateSaleDto, user: AuthUser) {
    const veiculo = await this.prisma.veiculo.findUnique({
      where: { id: dto.veiculoId },
      include: { custos: true },
    });
    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado.');
    }

    // Escopo multi-filial: usuário de filial só vende veículos da própria filial
    if (user.filialId && veiculo.filialId !== user.filialId) {
      throw new ForbiddenException('Este veículo pertence a outra filial.');
    }

    // Regra RF-02: não é possível vender um veículo já vendido
    if (veiculo.situacao === SituacaoVeiculo.VENDIDO) {
      throw new ConflictException('Este veículo já está vendido.');
    }

    const comprador = await this.prisma.cliente.findUnique({ where: { id: dto.compradorId } });
    if (!comprador) {
      throw new BadRequestException('Comprador (cliente) não encontrado.');
    }

    // Custo total no momento da venda (snapshot) = compra + custos adicionais
    const custoTotal =
      Number(veiculo.valorCompra) +
      veiculo.custos.reduce((acc, c) => acc + Number(c.valor), 0);

    // Cria a venda e marca o veículo como VENDIDO atomicamente
    const venda = await this.prisma.$transaction(async (tx) => {
      const novaVenda = await tx.venda.create({
        data: {
          veiculoId: dto.veiculoId,
          compradorId: dto.compradorId,
          vendedorId: user.id,
          // A venda herda a filial do veículo
          filialId: veiculo.filialId,
          dataVenda: new Date(dto.dataVenda),
          valorTotal: dto.valorTotal,
          formaPagamento: dto.formaPagamento,
          observacoes: dto.observacoes,
          custoTotalSnapshot: custoTotal,
        },
      });

      await tx.veiculo.update({
        where: { id: dto.veiculoId },
        data: { situacao: SituacaoVeiculo.VENDIDO },
      });

      return novaVenda;
    });

    // Gatilho RF-05: notifica o antigo proprietário sobre a ATPV
    void this.notifications
      .notificarAntigoProprietarioATPV({
        propNome: veiculo.propNome ?? '',
        propTelefone: veiculo.propTelefone,
        veiculo: `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})`,
        veiculoId: veiculo.id,
      })
      .catch(() => undefined);

    return this.serialize({ ...venda, custoTotalSnapshot: custoTotal });
  }

  async findAll(user: AuthUser, filialId?: string) {
    const vendas = await this.prisma.venda.findMany({
      where: filialWhere(user, filialId),
      orderBy: { dataVenda: 'desc' },
      include: {
        veiculo: { select: { id: true, marca: true, modelo: true, placa: true } },
        comprador: { select: { id: true, nome: true } },
        vendedor: { select: { id: true, nome: true } },
      },
    });
    return vendas.map((v) => this.serialize(v));
  }

  async findByVeiculo(veiculoId: string) {
    const venda = await this.prisma.venda.findUnique({
      where: { veiculoId },
      include: {
        comprador: { select: { id: true, nome: true, cpfCnpj: true } },
        vendedor: { select: { id: true, nome: true } },
      },
    });
    return venda ? this.serialize(venda) : null;
  }

  /** Converte Decimals em number e calcula o lucro bruto (RF-02). */
  private serialize(venda: any) {
    const valorTotal = Number(venda.valorTotal);
    const custoTotalSnapshot = Number(venda.custoTotalSnapshot);
    return {
      ...venda,
      valorTotal,
      custoTotalSnapshot,
      lucroBruto: Number((valorTotal - custoTotalSnapshot).toFixed(2)),
    };
  }
}

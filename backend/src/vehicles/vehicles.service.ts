import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SituacaoVeiculo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { filialParaCriar, filialWhere } from '../common/filial-scope';

const INCLUDE = {
  custos: true,
  fotos: { orderBy: { ordem: 'asc' as const } },
};

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto, user: AuthUser) {
    // Regra RF-01: não pode haver dois veículos com o mesmo chassi
    const chassiExistente = await this.prisma.veiculo.findUnique({
      where: { chassi: dto.chassi },
    });
    if (chassiExistente) {
      throw new ConflictException('Já existe um veículo cadastrado com este chassi.');
    }

    const filialId = filialParaCriar(user, dto.filialId);

    const veiculo = await this.prisma.veiculo.create({
      data: {
        filialId,
        placa: dto.placa,
        renavam: dto.renavam,
        chassi: dto.chassi,
        marca: dto.marca,
        modelo: dto.modelo,
        anoFabricacao: dto.anoFabricacao,
        anoModelo: dto.anoModelo,
        cor: dto.cor,
        combustivel: dto.combustivel,
        quilometragem: dto.quilometragem,
        dataEntrada: new Date(dto.dataEntrada),
        valorCompra: dto.valorCompra,
        valorVendaSugerido: dto.valorVendaSugerido,
        observacoes: dto.observacoes,
        propNome: dto.propNome,
        propCpfCnpj: dto.propCpfCnpj,
        propTelefone: dto.propTelefone,
        propEndereco: dto.propEndereco,
        // Regra RF-01: situação inicial é sempre DISPONIVEL
        situacao: SituacaoVeiculo.DISPONIVEL,
        custos: dto.custos?.length
          ? { create: dto.custos.map((c) => ({ descricao: c.descricao, categoria: c.categoria, valor: c.valor })) }
          : undefined,
        fotos: dto.fotos?.length
          ? { create: dto.fotos.map((f, i) => ({ url: f.url, legenda: f.legenda, ordem: f.ordem ?? i })) }
          : undefined,
      },
      include: INCLUDE,
    });

    return this.serialize(veiculo);
  }

  async findAll(query: QueryVehicleDto, user: AuthUser) {
    const where: Prisma.VeiculoWhereInput = { ...filialWhere(user, query.filialId) };
    if (query.situacao) where.situacao = query.situacao;
    if (query.marca) where.marca = { contains: query.marca, mode: 'insensitive' };
    if (query.busca) {
      where.OR = [
        { placa: { contains: query.busca, mode: 'insensitive' } },
        { chassi: { contains: query.busca, mode: 'insensitive' } },
      ];
    }

    const veiculos = await this.prisma.veiculo.findMany({
      where,
      include: INCLUDE,
      orderBy: { criadoEm: 'desc' },
    });

    return veiculos.map((v) => this.serialize(v));
  }

  async findOne(id: string) {
    const veiculo = await this.prisma.veiculo.findUnique({ where: { id }, include: INCLUDE });
    if (!veiculo) {
      throw new NotFoundException('Veículo não encontrado.');
    }
    return this.serialize(veiculo);
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.ensureExists(id);

    const data: Prisma.VeiculoUpdateInput = { ...dto };
    if (dto.dataEntrada) {
      data.dataEntrada = new Date(dto.dataEntrada);
    }

    const veiculo = await this.prisma.veiculo.update({
      where: { id },
      data,
      include: INCLUDE,
    });

    return this.serialize(veiculo);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    // Remove a venda vinculada primeiro (Parcelas têm cascade da Venda)
    await this.prisma.venda.deleteMany({ where: { veiculoId: id } });
    await this.prisma.veiculo.delete({ where: { id } });
    return { removido: true };
  }

  private async ensureExists(id: string) {
    const existe = await this.prisma.veiculo.findUnique({ where: { id }, select: { id: true } });
    if (!existe) {
      throw new NotFoundException('Veículo não encontrado.');
    }
  }

  /**
   * Converte Decimals em number e adiciona o custoTotal calculado (RF-01):
   * custoTotal = valorCompra + soma dos custos adicionais.
   */
  private serialize(veiculo: any) {
    const valorCompra = Number(veiculo.valorCompra);
    const custos = (veiculo.custos ?? []).map((c: any) => ({
      ...c,
      valor: Number(c.valor),
    }));
    const somaCustos = custos.reduce((acc: number, c: any) => acc + c.valor, 0);

    return {
      ...veiculo,
      valorCompra,
      valorVendaSugerido:
        veiculo.valorVendaSugerido != null ? Number(veiculo.valorVendaSugerido) : null,
      custos,
      custoTotal: Number((valorCompra + somaCustos).toFixed(2)),
    };
  }
}

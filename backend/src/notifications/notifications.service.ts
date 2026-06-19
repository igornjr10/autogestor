import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatusNotificacao } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Notificações (RF-05). Integra com o WhatsApp via Datafy API (espelho da Meta
 * Cloud API) quando DATAFY_API_TOKEN está configurado; caso contrário, simula o
 * envio. Todo disparo é registrado na tabela de notificações (log de mensagens).
 *
 * Datafy: POST {DATAFY_API_URL}/messages/send/text
 *   headers: Authorization: Bearer sk_live_xxx
 *   body: { to: "5511999999999", text: "..." }
 * O número remetente é identificado automaticamente pelo token.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('Notifications');

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Avisa o antigo proprietário sobre a ATPV (gatilho: venda concluída). */
  async notificarAntigoProprietarioATPV(params: {
    propNome: string;
    propTelefone?: string | null;
    veiculo: string;
    veiculoId?: string;
  }) {
    const mensagem =
      `Olá ${params.propNome}, o veículo ${params.veiculo} foi vendido. ` +
      `Por favor, compareça à loja para assinar a Autorização de Transferência (ATPV).`;
    return this.enviar('ATPV', params.propTelefone, mensagem, params.veiculoId);
  }

  /** Alerta sobre veículo parado há mais de 60 dias no estoque. */
  async alertaEstoque60Dias(params: { veiculo: string; dias: number; veiculoId?: string }) {
    const mensagem = `Atenção: o veículo ${params.veiculo} está há ${params.dias} dias em estoque.`;
    return this.enviar('ESTOQUE_60_DIAS', null, mensagem, params.veiculoId);
  }

  /** Núcleo de envio: tenta a Datafy API e registra o resultado no log. */
  private async enviar(tipo: string, destino: string | null | undefined, mensagem: string, veiculoId?: string) {
    const baseUrl = this.config.get<string>('DATAFY_API_URL', 'https://cloud.datafyapi.com.br');
    const token = this.config.get<string>('DATAFY_API_TOKEN');
    const to = this.normalizarTelefone(destino);

    let status: StatusNotificacao = StatusNotificacao.SIMULADA;
    let erro: string | undefined;

    if (token && to) {
      try {
        const resp = await fetch(`${baseUrl}/messages/send/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ to, text: mensagem }),
        });
        status = resp.ok ? StatusNotificacao.ENVIADA : StatusNotificacao.FALHOU;
        if (!resp.ok) {
          const corpo = await resp.text().catch(() => '');
          erro = `HTTP ${resp.status} ${corpo}`.trim().slice(0, 250);
        }
      } catch (e: any) {
        status = StatusNotificacao.FALHOU;
        erro = e?.message ?? 'erro de rede';
      }
    } else {
      const motivo = !token ? 'sem token Datafy' : 'sem telefone';
      this.logger.log(`[WhatsApp-simulado:${motivo}] (${tipo}) → ${destino ?? '-'}: ${mensagem}`);
    }

    return this.prisma.notificacao.create({
      data: { tipo, destino: to ?? destino ?? undefined, mensagem, status, erro, veiculoId },
    });
  }

  /** Normaliza o telefone para o formato do WhatsApp: dígitos com DDI 55. */
  private normalizarTelefone(valor?: string | null): string | null {
    if (!valor) return null;
    let d = valor.replace(/\D/g, '');
    if (!d) return null;
    // Remove zeros à esquerda (tronco) e adiciona DDI 55 quando ausente
    d = d.replace(/^0+/, '');
    if ((d.length === 10 || d.length === 11) && !d.startsWith('55')) {
      d = `55${d}`;
    }
    return d;
  }

  /** Envia uma mensagem de teste para validar a conexão Datafy. */
  enviarTeste(telefone: string) {
    return this.enviar(
      'TESTE',
      telefone,
      'Mensagem de teste do AutoGestor — Gestão Inteligente de Veículos. ✅',
    );
  }

  /** Avisa o cliente sobre documento pendente vinculado a um veículo. */
  async alertaDocumentoPendente(params: {
    clienteNome: string;
    clienteTelefone?: string | null;
    tipo: string;
    veiculo: string;
    veiculoId?: string;
  }) {
    const mensagem =
      `Ola ${params.clienteNome}, ha um documento pendente de entrega: ${params.tipo} ` +
      `referente ao veiculo ${params.veiculo}. Por favor, providencie o envio ou comparecimento a loja.`;
    return this.enviar('DOC_PENDENTE', params.clienteTelefone, mensagem, params.veiculoId);
  }

  /** Avisa o cliente sobre parcela vencida ou prestes a vencer. */
  async alertaParcela(params: {
    clienteNome: string;
    clienteTelefone?: string | null;
    numeroParcela: number;
    valor: string;
    vencimento: string;
    veiculo: string;
    tipo: 'VENCIDA' | 'PROXIMA';
  }) {
    const texto = params.tipo === 'VENCIDA'
      ? `Ola ${params.clienteNome}, a parcela ${params.numeroParcela} no valor de R$ ${params.valor} referente ao veiculo ${params.veiculo} esta vencida desde ${params.vencimento}. Por favor, regularize seu pagamento.`
      : `Ola ${params.clienteNome}, a parcela ${params.numeroParcela} no valor de R$ ${params.valor} referente ao veiculo ${params.veiculo} vence em ${params.vencimento}. Lembre-se de realizar o pagamento!`;
    return this.enviar(params.tipo === 'VENCIDA' ? 'PARCELA_VENCIDA' : 'PARCELA_PROXIMA', params.clienteTelefone, texto);
  }

  /** Varre documentos com status PENDENTE e dispara alertas. */
  async verificarDocumentosPendentes() {
    const docs = await this.prisma.documento.findMany({
      where: { status: 'PENDENTE' },
      include: {
        veiculo: true,
        cliente: true,
      },
    });

    for (const doc of docs) {
      const nome = doc.cliente?.nome ?? doc.veiculo?.propNome ?? 'Cliente';
      const telefone = doc.cliente?.telefone ?? doc.veiculo?.propTelefone;
      const veiculo = doc.veiculo ? `${doc.veiculo.marca} ${doc.veiculo.modelo} (${doc.veiculo.placa})` : '-';
      await this.alertaDocumentoPendente({
        clienteNome: nome,
        clienteTelefone: telefone,
        tipo: doc.tipo,
        veiculo,
        veiculoId: doc.veiculoId ?? undefined,
      });
    }
    return { documentosAlertados: docs.length };
  }

  /** Varre parcelas vencidas/proximas e dispara alertas WhatsApp. */
  async verificarParcelasVencidas() {
    const agora = new Date();
    const limite3dias = new Date(agora.getTime() + 3 * 86400000);

    const vencidas = await this.prisma.parcela.findMany({
      where: {
        OR: [
          { status: 'ATRASADO' },
          { status: 'PENDENTE', vencimento: { lt: agora } },
        ],
      },
      include: { venda: { include: { comprador: true, veiculo: true } } },
    });

    const proximas = await this.prisma.parcela.findMany({
      where: {
        status: 'PENDENTE',
        vencimento: { gte: agora, lte: limite3dias },
      },
      include: { venda: { include: { comprador: true, veiculo: true } } },
    });

    const fmt = (n: number) => n.toFixed(2).replace('.', ',');
    const fmtData = (d: Date) => new Date(d).toLocaleDateString('pt-BR');

    for (const p of vencidas) {
      await this.alertaParcela({
        clienteNome: p.venda.comprador.nome,
        clienteTelefone: p.venda.comprador.telefone,
        numeroParcela: p.numero,
        valor: fmt(Number(p.valor)),
        vencimento: fmtData(p.vencimento),
        veiculo: `${p.venda.veiculo.marca} ${p.venda.veiculo.modelo}`,
        tipo: 'VENCIDA',
      });
    }

    for (const p of proximas) {
      await this.alertaParcela({
        clienteNome: p.venda.comprador.nome,
        clienteTelefone: p.venda.comprador.telefone,
        numeroParcela: p.numero,
        valor: fmt(Number(p.valor)),
        vencimento: fmtData(p.vencimento),
        veiculo: `${p.venda.veiculo.marca} ${p.venda.veiculo.modelo}`,
        tipo: 'PROXIMA',
      });
    }

    return { vencidas: vencidas.length, proximasAVencer: proximas.length };
  }

  /** Retorna o status da conexão com a Datafy API. */
  status() {
    const token = this.config.get<string>('DATAFY_API_TOKEN');
    const url = this.config.get<string>('DATAFY_API_URL', 'https://cloud.datafyapi.com.br');
    return {
      conectado: !!token,
      modo: token ? 'API' : 'SIMULADO',
      endpoint: url,
    };
  }

  /** Lista o log de notificações enviadas. */
  listar() {
    return this.prisma.notificacao.findMany({ orderBy: { criadoEm: 'desc' }, take: 100 });
  }

  /** Varre o estoque e dispara alerta para veículos parados há mais de 60 dias. */
  async verificarEstoque60Dias() {
    const limite = new Date(Date.now() - 60 * 86400000);
    const parados = await this.prisma.veiculo.findMany({
      where: { situacao: { not: 'VENDIDO' }, dataEntrada: { lt: limite } },
      select: { id: true, marca: true, modelo: true, placa: true, dataEntrada: true },
    });

    for (const v of parados) {
      const dias = Math.floor((Date.now() - new Date(v.dataEntrada).getTime()) / 86400000);
      await this.alertaEstoque60Dias({
        veiculo: `${v.marca} ${v.modelo} (${v.placa})`,
        dias,
        veiculoId: v.id,
      });
    }
    return { veiculosAlertados: parados.length };
  }
}

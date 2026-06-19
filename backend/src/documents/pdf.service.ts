import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface DadosContrato {
  vendedorLoja: string;
  veiculo: {
    marca: string;
    modelo: string;
    anoFabricacao: number;
    anoModelo: number;
    placa: string;
    chassi: string;
    renavam: string;
    cor: string;
    quilometragem: number;
  };
  comprador: { nome: string; cpfCnpj: string; endereco?: string | null };
  valor: number;
  formaPagamento: string;
  data: Date;
  cidade?: string;
}

export interface DadosRecibo {
  pagador: string;
  cpfCnpj: string;
  valor: number;
  referente: string;
  data: Date;
  cidade?: string;
}

@Injectable()
export class PdfService {
  /** Gera o Contrato de Compra e Venda em PDF (RF-07, modelo parametrizável). */
  gerarContrato(d: DadosContrato): Promise<Buffer> {
    return this.render((doc) => {
      doc.fontSize(16).text('CONTRATO DE COMPRA E VENDA DE VEÍCULO', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10);
      doc.text(
        `Pelo presente instrumento particular, ${d.vendedorLoja}, doravante denominada VENDEDORA, ` +
          `e ${d.comprador.nome}, inscrito(a) no CPF/CNPJ sob nº ${d.comprador.cpfCnpj}` +
          `${d.comprador.endereco ? `, residente em ${d.comprador.endereco}` : ''}, doravante denominado(a) COMPRADOR(A), ` +
          `têm entre si justo e contratado o seguinte:`,
        { align: 'justify' },
      );
      doc.moveDown();

      this.secao(doc, 'CLÁUSULA 1ª – DO OBJETO');
      doc.text(
        `A VENDEDORA vende ao COMPRADOR o veículo ${d.veiculo.marca} ${d.veiculo.modelo}, ` +
          `ano ${d.veiculo.anoFabricacao}/${d.veiculo.anoModelo}, cor ${d.veiculo.cor}, ` +
          `placa ${d.veiculo.placa.toUpperCase()}, chassi ${d.veiculo.chassi.toUpperCase()}, ` +
          `Renavam ${d.veiculo.renavam}, com ${d.veiculo.quilometragem.toLocaleString('pt-BR')} km.`,
        { align: 'justify' },
      );
      doc.moveDown();

      this.secao(doc, 'CLÁUSULA 2ª – DO PREÇO E PAGAMENTO');
      doc.text(
        `O preço total ajustado é de ${this.moeda(d.valor)}, na forma de pagamento: ${d.formaPagamento}.`,
        { align: 'justify' },
      );
      doc.moveDown();

      this.secao(doc, 'CLÁUSULA 3ª – DA TRANSFERÊNCIA');
      doc.text(
        'O COMPRADOR se obriga a providenciar a transferência da propriedade do veículo junto ao ' +
          'órgão de trânsito competente no prazo legal, assumindo a responsabilidade por débitos ' +
          'e infrações posteriores à data desta venda.',
        { align: 'justify' },
      );
      doc.moveDown(2);

      const dataStr = d.data.toLocaleDateString('pt-BR');
      doc.text(`${d.cidade ?? '__________________'}, ${dataStr}.`, { align: 'right' });
      doc.moveDown(3);

      doc.text('______________________________________', { align: 'center' });
      doc.text('VENDEDORA', { align: 'center' });
      doc.moveDown(2);
      doc.text('______________________________________', { align: 'center' });
      doc.text('COMPRADOR(A)', { align: 'center' });
    });
  }

  /** Gera recibo de sinal/entrada em PDF (RF-07). */
  gerarRecibo(d: DadosRecibo): Promise<Buffer> {
    return this.render((doc) => {
      doc.fontSize(16).text('RECIBO', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(12).text(`Valor: ${this.moeda(d.valor)}`, { align: 'left' });
      doc.moveDown();
      doc.fontSize(11).text(
        `Recebi de ${d.pagador}, CPF/CNPJ nº ${d.cpfCnpj}, a importância de ${this.moeda(d.valor)}, ` +
          `referente a ${d.referente}.`,
        { align: 'justify' },
      );
      doc.moveDown(3);
      doc.text(`${d.cidade ?? '__________________'}, ${d.data.toLocaleDateString('pt-BR')}.`, { align: 'right' });
      doc.moveDown(3);
      doc.text('______________________________________', { align: 'center' });
      doc.text('Assinatura', { align: 'center' });
    });
  }

  private render(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      draw(doc);
      doc.end();
    });
  }

  private secao(doc: PDFKit.PDFDocument, titulo: string) {
    doc.font('Helvetica-Bold').text(titulo);
    doc.font('Helvetica');
  }

  private moeda(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}

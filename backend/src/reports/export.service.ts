import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export interface Coluna {
  header: string;
  key: string;
  /** Formata o valor da célula (ex.: moeda, data). */
  format?: (valor: any) => string;
  width?: number;
}

@Injectable()
export class ExportService {
  async toExcel(titulo: string, colunas: Coluna[], linhas: any[]): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(titulo.slice(0, 31) || 'Relatório');

    ws.columns = colunas.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 22 }));
    ws.getRow(1).font = { bold: true };

    linhas.forEach((linha) => {
      const row: Record<string, any> = {};
      colunas.forEach((c) => {
        row[c.key] = c.format ? c.format(linha[c.key]) : linha[c.key];
      });
      ws.addRow(row);
    });

    const data = await wb.xlsx.writeBuffer();
    return Buffer.from(data);
  }

  toPdf(titulo: string, colunas: Coluna[], linhas: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(titulo, { align: 'center' });
      doc.moveDown();

      const startX = doc.page.margins.left;
      const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidth = usableWidth / colunas.length;
      let y = doc.y;

      // Cabeçalho
      doc.fontSize(9).font('Helvetica-Bold');
      colunas.forEach((c, i) => {
        doc.text(c.header, startX + i * colWidth, y, { width: colWidth - 4 });
      });
      y += 18;
      doc.moveTo(startX, y - 4).lineTo(startX + usableWidth, y - 4).stroke();

      // Linhas
      doc.font('Helvetica').fontSize(8);
      linhas.forEach((linha) => {
        if (y > doc.page.height - doc.page.margins.bottom - 20) {
          doc.addPage({ size: 'A4', margin: 40, layout: 'landscape' });
          y = doc.y;
        }
        colunas.forEach((c, i) => {
          const valor = c.format ? c.format(linha[c.key]) : linha[c.key];
          doc.text(valor != null ? String(valor) : '—', startX + i * colWidth, y, { width: colWidth - 4 });
        });
        y += 16;
      });

      if (linhas.length === 0) {
        doc.text('Sem dados para o período.', startX, y);
      }

      doc.end();
    });
  }
}

import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PdfService } from './pdf.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, PdfService],
})
export class DocumentsModule {}

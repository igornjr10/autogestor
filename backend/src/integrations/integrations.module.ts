import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { ApiBrasilProvider } from './providers/apibrasil.provider';
import { ApiBrasilFipeChassiService } from './providers/apibrasil-fipe-chassi.service';
import { ConsultarPlacaProvider } from './providers/consultarplaca.provider';
import { VEHICLE_DATA_PROVIDER } from './providers/vehicle-data.provider';
import { DOCUMENT_DATA_PROVIDER } from './providers/document-data.provider';

@Module({
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    ApiBrasilProvider,
    ApiBrasilFipeChassiService,
    ConsultarPlacaProvider,
    // Dados/FIPE por placa → API Brasil (provedor principal)
    { provide: VEHICLE_DATA_PROVIDER, useExisting: ApiBrasilProvider },
    // CPF/CNPJ → API Brasil (mantido)
    { provide: DOCUMENT_DATA_PROVIDER, useExisting: ApiBrasilProvider },
  ],
})
export class IntegrationsModule {}

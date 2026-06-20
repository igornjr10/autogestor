import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ClientsModule } from './clients/clients.module';
import { SalesModule } from './sales/sales.module';
import { CashflowModule } from './cashflow/cashflow.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FiliaisModule } from './filiais/filiais.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ParcelasModule } from './parcelas/parcelas.module';
import { FipeModule } from './fipe/fipe.module';
import { BackupModule } from './backup/backup.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    ClientsModule,
    SalesModule,
    CashflowModule,
    DashboardModule,
    DocumentsModule,
    ReportsModule,
    NotificationsModule,
    FiliaisModule,
    IntegrationsModule,
    ParcelasModule,
    FipeModule,
    BackupModule,
  ],
  providers: [
    // JWT exigido por padrão (rotas liberadas com @Public)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // RBAC por perfil (@Roles)
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

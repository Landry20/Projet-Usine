import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtGuard } from './common/guards/jwt.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { buildTypeOrmOptions } from './database/database.config';
import * as entities from './database/entities';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DemandesModule } from './modules/demandes/demandes.module';
import { EquipementsModule } from './modules/equipements/equipements.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdresTravailModule } from './modules/ordres-travail/ordres-travail.module';
import { ReferentielsModule } from './modules/referentiels/referentiels.module';
import { SitesModule } from './modules/sites/sites.module';
import { StockModule } from './modules/stock/stock.module';
import { TechniciensModule } from './modules/techniciens/techniciens.module';
import { ProductionModule } from './modules/production/production.module';
import { QuartModule } from './modules/quart/quart.module';
import { TanksModule } from './modules/tanks/tanks.module';
import { LaboratoireModule } from './modules/laboratoire/laboratoire.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UtilisateursModule } from './modules/utilisateurs/utilisateurs.module';

const ENTITES = Object.values(entities).filter((v) => typeof v === 'function');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limitation globale : 120 requêtes / minute / IP (anti-abus CDC §12)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmOptions(config, ENTITES),
    }),
    AuthModule,
    UtilisateursModule,
    SitesModule,
    ReferentielsModule,
    EquipementsModule,
    DemandesModule,
    OrdresTravailModule,
    StockModule,
    TechniciensModule,
    DashboardModule,
    AuditModule,
    NotificationsModule,
    UploadsModule,
    ProductionModule,
    QuartModule,
    TanksModule,
    LaboratoireModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}

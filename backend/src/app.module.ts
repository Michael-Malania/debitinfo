import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RsGeModule } from './modules/rsge/rsge.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { AnalystModule } from './modules/analyst/analyst.module';
import { OpsModule } from './modules/ops/ops.module';
import { LegalModule } from './modules/legal/legal.module';
import { VisitsModule } from './modules/visits/visits.module';
import { CrmModule } from './modules/crm/crm.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RsGeModule,
    AuthModule,
    ClaimsModule,
    AnalystModule,
    OpsModule,
    LegalModule,
    VisitsModule,
    CrmModule,
    PaymentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminsModule } from './admins/admins.module';
import { SuperAdminsModule } from './super-admins/super-admins.module';
import { User } from './users/user.entity';
import { Admin } from './admins/admin.entity';
import { SuperAdmin } from './super-admins/super-admin.entity';
import { PannesModule } from './pannes/pannes.module';
import { Panne } from './pannes/panne.entity';
import { VehiculesModule } from './vehicules/vehicules.module';
import { Vehicule } from './vehicules/vehicule.entity';
import { ServicesModule } from './services/services.module';
import { ServiceEntity } from './services/service.entity';
import { RendezVousModule } from './rendez-vous/rendez-vous.module';
import { RendezVous } from './rendez-vous/rendez-vous.entity';
import { ChatbotRulesModule } from './chatbot-rules/chatbot-rules.module';
import { ChatbotRule } from './chatbot-rules/chatbot-rules.entity';
import { ReclamationsModule } from './reclamations/reclamations.module';
import { Reclamation } from './reclamations/reclamation.entity';
import { ChatbotHistoryModule } from './chatbot-history/chatbot-history.module';
import { ChatbotHistory } from './chatbot-history/chatbot-history.entity';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { Evaluation } from './evaluations/evaluation.entity';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: parseInt(config.get<string>('DB_PORT') || '5432', 10),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [
          User,
          Admin,
          SuperAdmin,
          Panne,
          Vehicule,
          ServiceEntity,
          RendezVous,
          ChatbotRule,
          Reclamation,
          ChatbotHistory,
          Evaluation,
        ],
        synchronize: false,
      }),
    }),

    AuthModule,
    UsersModule,
    AdminsModule,
    SuperAdminsModule,
    PannesModule,
    VehiculesModule,
    ServicesModule,
    RendezVousModule,
    ChatbotRulesModule,
    ReclamationsModule,
    ChatbotHistoryModule,
    EvaluationsModule,

  ],
})
export class AppModule {}
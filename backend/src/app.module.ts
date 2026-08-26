import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { REALTIME_PUBLISHER } from './application/interfaces/realtime-publisher';
import {
  PASSWORD_HASHER,
  TOKEN_SERVICE,
} from './application/interfaces/auth.interfaces';
import { GetMeUseCase } from './application/use-cases/auth/get-me.use-case';
import { LoginUserUseCase } from './application/use-cases/auth/login-user.use-case';
import { LogoutUserUseCase } from './application/use-cases/auth/logout-user.use-case';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.use-case';
import { RegisterUserUseCase } from './application/use-cases/auth/register-user.use-case';
import { ListActivitiesUseCase } from './application/use-cases/activities/list-activities.use-case';
import { AddBoardMemberUseCase } from './application/use-cases/boards/add-board-member.use-case';
import { CreateBoardUseCase } from './application/use-cases/boards/create-board.use-case';
import { DeleteBoardUseCase } from './application/use-cases/boards/delete-board.use-case';
import { GetBoardUseCase } from './application/use-cases/boards/get-board.use-case';
import { ListBoardsUseCase } from './application/use-cases/boards/list-boards.use-case';
import { UpdateBoardUseCase } from './application/use-cases/boards/update-board.use-case';
import { CreateCardUseCase } from './application/use-cases/cards/create-card.use-case';
import { DeleteCardUseCase } from './application/use-cases/cards/delete-card.use-case';
import { ListCardsUseCase } from './application/use-cases/cards/list-cards.use-case';
import { MoveCardUseCase } from './application/use-cases/cards/move-card.use-case';
import { UpdateCardUseCase } from './application/use-cases/cards/update-card.use-case';
import { CreateColumnUseCase } from './application/use-cases/columns/create-column.use-case';
import { DeleteColumnUseCase } from './application/use-cases/columns/delete-column.use-case';
import { ReorderColumnsUseCase } from './application/use-cases/columns/reorder-columns.use-case';
import { UpdateColumnUseCase } from './application/use-cases/columns/update-column.use-case';
import { CreateLabelUseCase } from './application/use-cases/labels/create-label.use-case';
import { DeleteLabelUseCase } from './application/use-cases/labels/delete-label.use-case';
import { ListLabelsUseCase } from './application/use-cases/labels/list-labels.use-case';
import { CreateSprintUseCase } from './application/use-cases/sprints/create-sprint.use-case';
import { DeleteSprintUseCase } from './application/use-cases/sprints/delete-sprint.use-case';
import { ListSprintsUseCase } from './application/use-cases/sprints/list-sprints.use-case';
import { UpdateSprintUseCase } from './application/use-cases/sprints/update-sprint.use-case';
import { AddManualTimeLogUseCase } from './application/use-cases/timelogs/add-manual-timelog.use-case';
import { DeleteTimeLogUseCase } from './application/use-cases/timelogs/delete-timelog.use-case';
import { ListTimeLogsUseCase } from './application/use-cases/timelogs/list-timelogs.use-case';
import { StartTimeLogUseCase } from './application/use-cases/timelogs/start-timelog.use-case';
import { StopTimeLogUseCase } from './application/use-cases/timelogs/stop-timelog.use-case';
import { ACTIVITY_REPOSITORY } from './domain/repositories/activity.repository';
import { BOARD_REPOSITORY } from './domain/repositories/board.repository';
import { CARD_REPOSITORY } from './domain/repositories/card.repository';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository';
import { SPRINT_REPOSITORY } from './domain/repositories/sprint.repository';
import { TIMELOG_REPOSITORY } from './domain/repositories/timelog.repository';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { BcryptPasswordHasher } from './infrastructure/auth/bcrypt-password.hasher';
import { JwtAuthGuard } from './infrastructure/auth/jwt-auth.guard';
import { JwtTokenService } from './infrastructure/auth/jwt-token.service';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { PrismaActivityRepository } from './infrastructure/repositories/prisma-activity.repository';
import { PrismaBoardRepository } from './infrastructure/repositories/prisma-board.repository';
import { PrismaCardRepository } from './infrastructure/repositories/prisma-card.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { PrismaSprintRepository } from './infrastructure/repositories/prisma-sprint.repository';
import { PrismaTimeLogRepository } from './infrastructure/repositories/prisma-timelog.repository';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { RealtimeGateway } from './infrastructure/websockets/realtime.gateway';
import { SocketRealtimePublisher } from './infrastructure/websockets/socket-realtime.publisher';
import { ActivitiesController } from './presentation/controllers/activities.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { BoardsController } from './presentation/controllers/boards.controller';
import { CardsController } from './presentation/controllers/cards.controller';
import { ColumnsController } from './presentation/controllers/columns.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { LabelsController } from './presentation/controllers/labels.controller';
import { SprintsController } from './presentation/controllers/sprints.controller';
import { TimeLogsController } from './presentation/controllers/timelogs.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [
    HealthController,
    AuthController,
    BoardsController,
    ColumnsController,
    CardsController,
    LabelsController,
    ActivitiesController,
    SprintsController,
    TimeLogsController,
  ],
  providers: [
    JwtStrategy,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },
    { provide: BOARD_REPOSITORY, useClass: PrismaBoardRepository },
    { provide: CARD_REPOSITORY, useClass: PrismaCardRepository },
    { provide: ACTIVITY_REPOSITORY, useClass: PrismaActivityRepository },
    { provide: SPRINT_REPOSITORY, useClass: PrismaSprintRepository },
    { provide: TIMELOG_REPOSITORY, useClass: PrismaTimeLogRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    RealtimeGateway,
    SocketRealtimePublisher,
    { provide: REALTIME_PUBLISHER, useExisting: SocketRealtimePublisher },
    RegisterUserUseCase,
    LoginUserUseCase,
    RefreshTokenUseCase,
    LogoutUserUseCase,
    GetMeUseCase,
    CreateBoardUseCase,
    ListBoardsUseCase,
    GetBoardUseCase,
    UpdateBoardUseCase,
    DeleteBoardUseCase,
    AddBoardMemberUseCase,
    CreateColumnUseCase,
    UpdateColumnUseCase,
    DeleteColumnUseCase,
    ReorderColumnsUseCase,
    CreateCardUseCase,
    UpdateCardUseCase,
    DeleteCardUseCase,
    MoveCardUseCase,
    ListCardsUseCase,
    CreateLabelUseCase,
    ListLabelsUseCase,
    DeleteLabelUseCase,
    ListActivitiesUseCase,
    CreateSprintUseCase,
    ListSprintsUseCase,
    UpdateSprintUseCase,
    DeleteSprintUseCase,
    StartTimeLogUseCase,
    StopTimeLogUseCase,
    ListTimeLogsUseCase,
    AddManualTimeLogUseCase,
    DeleteTimeLogUseCase,
  ],
})
export class AppModule {}

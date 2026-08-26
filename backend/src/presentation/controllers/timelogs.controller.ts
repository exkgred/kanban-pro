import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AccessTokenPayload } from '../../application/interfaces/auth.interfaces';
import { AddManualTimeLogUseCase } from '../../application/use-cases/timelogs/add-manual-timelog.use-case';
import { DeleteTimeLogUseCase } from '../../application/use-cases/timelogs/delete-timelog.use-case';
import { ListTimeLogsUseCase } from '../../application/use-cases/timelogs/list-timelogs.use-case';
import { StartTimeLogUseCase } from '../../application/use-cases/timelogs/start-timelog.use-case';
import { StopTimeLogUseCase } from '../../application/use-cases/timelogs/stop-timelog.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AddManualTimeLogDto, StartTimeLogDto } from '../dto/board.dto';

@ApiTags('TimeLogs')
@ApiBearerAuth()
@Controller('boards/:boardId/cards/:cardId/timelogs')
@UseGuards(JwtAuthGuard)
export class TimeLogsController {
  constructor(
    private readonly startTimeLog: StartTimeLogUseCase,
    private readonly stopTimeLog: StopTimeLogUseCase,
    private readonly listTimeLogs: ListTimeLogsUseCase,
    private readonly addManualTimeLog: AddManualTimeLogUseCase,
    private readonly deleteTimeLog: DeleteTimeLogUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar apontamentos de horas do card' })
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
  ) {
    return this.listTimeLogs.execute(boardId, cardId, user.sub);
  }

  @Post('start')
  @ApiOperation({ summary: 'Iniciar cronômetro (Play)' })
  start(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
    @Body() dto: StartTimeLogDto = {},
  ) {
    return this.startTimeLog.execute({
      boardId,
      cardId,
      userId: user.sub,
      description: dto.description,
    });
  }

  @Post('manual')
  @ApiOperation({ summary: 'Apontar horas manualmente' })
  addManual(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
    @Body() dto: AddManualTimeLogDto,
  ) {
    return this.addManualTimeLog.execute({
      boardId,
      cardId,
      userId: user.sub,
      hours: dto.hours,
      description: dto.description,
      date: dto.date ? new Date(dto.date) : undefined,
    });
  }

  @Post(':timeLogId/stop')
  @ApiOperation({ summary: 'Pausar cronômetro e registrar horas (Pause)' })
  stop(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
    @Param('timeLogId') timeLogId: string,
  ) {
    return this.stopTimeLog.execute({
      boardId,
      cardId,
      timeLogId,
      userId: user.sub,
    });
  }

  @Delete(':timeLogId')
  @ApiOperation({ summary: 'Excluir apontamento de horas' })
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
    @Param('timeLogId') timeLogId: string,
  ) {
    return this.deleteTimeLog.execute({
      boardId,
      cardId,
      timeLogId,
      userId: user.sub,
    });
  }
}

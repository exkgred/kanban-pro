import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AccessTokenPayload } from '../../application/interfaces/auth.interfaces';
import { CreateSprintUseCase } from '../../application/use-cases/sprints/create-sprint.use-case';
import { DeleteSprintUseCase } from '../../application/use-cases/sprints/delete-sprint.use-case';
import { ListSprintsUseCase } from '../../application/use-cases/sprints/list-sprints.use-case';
import { UpdateSprintUseCase } from '../../application/use-cases/sprints/update-sprint.use-case';
import type { SprintStatus } from '../../domain/entities/sprint.entity';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateSprintDto, UpdateSprintDto } from '../dto/board.dto';

@ApiTags('Sprints')
@ApiBearerAuth()
@Controller('boards/:boardId/sprints')
@UseGuards(JwtAuthGuard)
export class SprintsController {
  constructor(
    private readonly createSprint: CreateSprintUseCase,
    private readonly listSprints: ListSprintsUseCase,
    private readonly updateSprint: UpdateSprintUseCase,
    private readonly deleteSprint: DeleteSprintUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar sprints do quadro' })
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
  ) {
    return this.listSprints.execute(boardId, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Criar sprint' })
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Body() dto: CreateSprintDto,
  ) {
    return this.createSprint.execute({
      boardId,
      userId: user.sub,
      name: dto.name,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: dto.status as SprintStatus | undefined,
    });
  }

  @Patch(':sprintId')
  @ApiOperation({ summary: 'Atualizar sprint' })
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('sprintId') sprintId: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.updateSprint.execute({
      boardId,
      sprintId,
      userId: user.sub,
      data: {
        name: dto.name,
        startDate:
          dto.startDate === undefined
            ? undefined
            : dto.startDate
              ? new Date(dto.startDate)
              : null,
        endDate:
          dto.endDate === undefined
            ? undefined
            : dto.endDate
              ? new Date(dto.endDate)
              : null,
        status: dto.status as SprintStatus | undefined,
      },
    });
  }

  @Delete(':sprintId')
  @ApiOperation({ summary: 'Excluir sprint' })
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('sprintId') sprintId: string,
  ) {
    await this.deleteSprint.execute({ boardId, sprintId, userId: user.sub });
    return { ok: true };
  }
}

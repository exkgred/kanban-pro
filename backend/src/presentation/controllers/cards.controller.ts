import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AccessTokenPayload } from '../../application/interfaces/auth.interfaces';
import { CreateCardUseCase } from '../../application/use-cases/cards/create-card.use-case';
import { DeleteCardUseCase } from '../../application/use-cases/cards/delete-card.use-case';
import { ListCardsUseCase } from '../../application/use-cases/cards/list-cards.use-case';
import { MoveCardUseCase } from '../../application/use-cases/cards/move-card.use-case';
import { UpdateCardUseCase } from '../../application/use-cases/cards/update-card.use-case';
import type { CardPriority } from '../../domain/value-objects/card-priority';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateCardDto, MoveCardDto, UpdateCardDto } from '../dto/board.dto';

@ApiTags('Cards')
@ApiBearerAuth()
@Controller('boards/:boardId/cards')
@UseGuards(JwtAuthGuard)
export class CardsController {
  constructor(
    private readonly createCard: CreateCardUseCase,
    private readonly listCards: ListCardsUseCase,
    private readonly updateCard: UpdateCardUseCase,
    private readonly deleteCard: DeleteCardUseCase,
    private readonly moveCard: MoveCardUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar cards com filtros' })
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Query('labelId') labelId?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('sprintId') sprintId?: string,
    @Query('priority') priority?: CardPriority,
    @Query('q') q?: string,
  ) {
    return this.listCards.execute({
      boardId,
      userId: user.sub,
      filters: { labelId, assigneeId, sprintId, priority, q },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Criar card' })
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Body() dto: CreateCardDto,
  ) {
    return this.createCard.execute({
      boardId,
      userId: user.sub,
      columnId: dto.columnId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      assigneeId: dto.assigneeId,
      sprintId: dto.sprintId ?? null,
      estimatedHours: dto.estimatedHours,
      labelIds: dto.labelIds,
    });
  }

  @Patch(':cardId')
  @ApiOperation({ summary: 'Atualizar card' })
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardDto,
  ) {
    return this.updateCard.execute({
      boardId,
      cardId,
      userId: user.sub,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueDate:
        dto.dueDate === undefined
          ? undefined
          : dto.dueDate
            ? new Date(dto.dueDate)
            : null,
      assigneeId: dto.assigneeId,
      sprintId: dto.sprintId,
      estimatedHours: dto.estimatedHours,
      labelIds: dto.labelIds,
    });
  }

  @Delete(':cardId')
  @ApiOperation({ summary: 'Excluir card' })
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
  ) {
    await this.deleteCard.execute({ boardId, cardId, userId: user.sub });
    return { ok: true };
  }

  @Post(':cardId/move')
  @ApiOperation({ summary: 'Mover card entre colunas' })
  move(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
    @Body() dto: MoveCardDto,
  ) {
    return this.moveCard.execute({
      boardId,
      cardId,
      userId: user.sub,
      columnId: dto.columnId,
      position: dto.position,
    });
  }
}

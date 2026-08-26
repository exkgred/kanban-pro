import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AccessTokenPayload } from '../../application/interfaces/auth.interfaces';
import { CreateColumnUseCase } from '../../application/use-cases/columns/create-column.use-case';
import { DeleteColumnUseCase } from '../../application/use-cases/columns/delete-column.use-case';
import { ReorderColumnsUseCase } from '../../application/use-cases/columns/reorder-columns.use-case';
import { UpdateColumnUseCase } from '../../application/use-cases/columns/update-column.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  CreateColumnDto,
  ReorderColumnsDto,
  UpdateColumnDto,
} from '../dto/board.dto';

@ApiTags('Columns')
@ApiBearerAuth()
@Controller('boards/:boardId/columns')
@UseGuards(JwtAuthGuard)
export class ColumnsController {
  constructor(
    private readonly createColumn: CreateColumnUseCase,
    private readonly updateColumn: UpdateColumnUseCase,
    private readonly deleteColumn: DeleteColumnUseCase,
    private readonly reorderColumns: ReorderColumnsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar coluna' })
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.createColumn.execute({
      boardId,
      userId: user.sub,
      title: dto.title,
      position: dto.position,
    });
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Reordenar colunas' })
  reorder(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Body() dto: ReorderColumnsDto,
  ) {
    return this.reorderColumns.execute({
      boardId,
      userId: user.sub,
      items: dto.items,
    });
  }

  @Patch(':columnId')
  @ApiOperation({ summary: 'Atualizar coluna' })
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.updateColumn.execute({
      boardId,
      columnId,
      userId: user.sub,
      title: dto.title,
      position: dto.position,
    });
  }

  @Delete(':columnId')
  @ApiOperation({ summary: 'Excluir coluna' })
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
  ) {
    await this.deleteColumn.execute({ boardId, columnId, userId: user.sub });
    return { ok: true };
  }
}

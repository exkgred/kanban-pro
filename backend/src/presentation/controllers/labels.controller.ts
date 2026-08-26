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
import { CreateLabelUseCase } from '../../application/use-cases/labels/create-label.use-case';
import { DeleteLabelUseCase } from '../../application/use-cases/labels/delete-label.use-case';
import { ListLabelsUseCase } from '../../application/use-cases/labels/list-labels.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateLabelDto } from '../dto/board.dto';

@ApiTags('Labels')
@ApiBearerAuth()
@Controller('boards/:boardId/labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
  constructor(
    private readonly createLabel: CreateLabelUseCase,
    private readonly listLabels: ListLabelsUseCase,
    private readonly deleteLabel: DeleteLabelUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar etiquetas' })
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
  ) {
    return this.listLabels.execute({ boardId, userId: user.sub });
  }

  @Post()
  @ApiOperation({ summary: 'Criar etiqueta' })
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Body() dto: CreateLabelDto,
  ) {
    return this.createLabel.execute({
      boardId,
      userId: user.sub,
      name: dto.name,
      color: dto.color,
    });
  }

  @Delete(':labelId')
  @ApiOperation({ summary: 'Excluir etiqueta' })
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Param('labelId') labelId: string,
  ) {
    await this.deleteLabel.execute({ boardId, labelId, userId: user.sub });
    return { ok: true };
  }
}

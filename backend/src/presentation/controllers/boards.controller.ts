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
import { AddBoardMemberUseCase } from '../../application/use-cases/boards/add-board-member.use-case';
import { CreateBoardUseCase } from '../../application/use-cases/boards/create-board.use-case';
import { DeleteBoardUseCase } from '../../application/use-cases/boards/delete-board.use-case';
import { GetBoardUseCase } from '../../application/use-cases/boards/get-board.use-case';
import { ListBoardsUseCase } from '../../application/use-cases/boards/list-boards.use-case';
import { UpdateBoardUseCase } from '../../application/use-cases/boards/update-board.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AddMemberDto, CreateBoardDto, UpdateBoardDto } from '../dto/board.dto';

@ApiTags('Boards')
@ApiBearerAuth()
@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(
    private readonly createBoard: CreateBoardUseCase,
    private readonly listBoards: ListBoardsUseCase,
    private readonly getBoard: GetBoardUseCase,
    private readonly updateBoard: UpdateBoardUseCase,
    private readonly deleteBoard: DeleteBoardUseCase,
    private readonly addMember: AddBoardMemberUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar boards do usuário' })
  list(@CurrentUser() user: AccessTokenPayload) {
    return this.listBoards.execute({ userId: user.sub });
  }

  @Post()
  @ApiOperation({ summary: 'Criar board' })
  create(@CurrentUser() user: AccessTokenPayload, @Body() dto: CreateBoardDto) {
    return this.createBoard.execute({
      userId: user.sub,
      title: dto.title,
      description: dto.description,
      visibility: dto.visibility,
    });
  }

  @Get(':boardId')
  @ApiOperation({ summary: 'Detalhe do board' })
  get(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
  ) {
    return this.getBoard.execute({ boardId, userId: user.sub });
  }

  @Patch(':boardId')
  @ApiOperation({ summary: 'Atualizar board' })
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.updateBoard.execute({
      boardId,
      userId: user.sub,
      title: dto.title,
      description: dto.description,
      visibility: dto.visibility,
    });
  }

  @Delete(':boardId')
  @ApiOperation({ summary: 'Excluir board' })
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
  ) {
    await this.deleteBoard.execute({ boardId, userId: user.sub });
    return { ok: true };
  }

  @Post(':boardId/members')
  @ApiOperation({ summary: 'Convidar membro por e-mail' })
  invite(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.addMember.execute({
      boardId,
      userId: user.sub,
      email: dto.email,
      role: dto.role,
    });
  }
}

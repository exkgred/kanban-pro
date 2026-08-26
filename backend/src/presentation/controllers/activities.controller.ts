import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AccessTokenPayload } from '../../application/interfaces/auth.interfaces';
import { ListActivitiesUseCase } from '../../application/use-cases/activities/list-activities.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('boards/:boardId/activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly listActivities: ListActivitiesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Histórico de atividades do board' })
  list(
    @CurrentUser() user: AccessTokenPayload,
    @Param('boardId') boardId: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.listActivities.execute({
      boardId,
      userId: user.sub,
      page: page ? Number(page) : 1,
      perPage: perPage ? Number(perPage) : 20,
    });
  }
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBoardDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'WORKSPACE'] })
  @IsOptional()
  @IsEnum(['PRIVATE', 'WORKSPACE'])
  visibility?: 'PRIVATE' | 'WORKSPACE';
}

export class UpdateBoardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'WORKSPACE'] })
  @IsOptional()
  @IsEnum(['PRIVATE', 'WORKSPACE'])
  visibility?: 'PRIVATE' | 'WORKSPACE';
}

export class AddMemberDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'MEMBER'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'MEMBER'])
  role?: 'ADMIN' | 'MEMBER';
}

export class CreateColumnDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class UpdateColumnDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class ReorderColumnItemDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position!: number;
}

export class ReorderColumnsDto {
  @ApiProperty({ type: [ReorderColumnItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderColumnItemDto)
  items!: ReorderColumnItemDto[];
}

export class CreateCardDto {
  @ApiProperty()
  @IsString()
  columnId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  sprintId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedHours?: number;
}

export class UpdateCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  dueDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  sprintId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedHours?: number;
}

export class MoveCardDto {
  @ApiProperty()
  @IsString()
  columnId!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position!: number;
}

export class CreateLabelDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  color!: string;
}

export class CreateSprintDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['PLANNED', 'ACTIVE', 'COMPLETED'] })
  @IsOptional()
  @IsEnum(['PLANNED', 'ACTIVE', 'COMPLETED'])
  status?: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
}

export class UpdateSprintDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  startDate?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional({ enum: ['PLANNED', 'ACTIVE', 'COMPLETED'] })
  @IsOptional()
  @IsEnum(['PLANNED', 'ACTIVE', 'COMPLETED'])
  status?: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
}

export class StartTimeLogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class AddManualTimeLogDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  hours!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}

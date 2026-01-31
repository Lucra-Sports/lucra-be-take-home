import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CellStatus, GameStatus } from './entities';
import { GAME_LIMITS, PAGINATION } from './config';

export class CreateGameDto {
  @Type(() => Number)
  @IsInt()
  @Min(GAME_LIMITS.minDimension)
  @Max(GAME_LIMITS.maxDimension)
  @ApiProperty({
    example: 8,
    minimum: GAME_LIMITS.minDimension,
    maximum: GAME_LIMITS.maxDimension,
  })
  rows: number;

  @Type(() => Number)
  @IsInt()
  @Min(GAME_LIMITS.minDimension)
  @Max(GAME_LIMITS.maxDimension)
  @ApiProperty({
    example: 8,
    minimum: GAME_LIMITS.minDimension,
    maximum: GAME_LIMITS.maxDimension,
  })
  columns: number;
}

export class GameSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 8 })
  rows: number;

  @ApiProperty({ example: 8 })
  columns: number;

  @ApiProperty({ enum: GameStatus })
  status: GameStatus;
}

export class ListGamesResponseDto {
  @ApiProperty({ type: [GameSummaryDto] })
  data: GameSummaryDto[];

  @ApiProperty({ example: 0 })
  total: number;

  @ApiProperty({ example: 50 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}

export class ListGamesQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION.maxLimit)
  @IsOptional()
  @ApiProperty({ required: false, example: PAGINATION.defaultLimit })
  limit?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiProperty({ required: false, example: 0 })
  offset?: number;
}

export class MoveDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({ example: 0, minimum: 0 })
  x: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({ example: 0, minimum: 0 })
  y: number;

  @IsEnum(['REVEAL', 'FLAG', 'UNFLAG'])
  @IsOptional()
  @ApiProperty({ example: 'REVEAL', enum: ['REVEAL', 'FLAG', 'UNFLAG'] })
  action?: 'REVEAL' | 'FLAG' | 'UNFLAG';
}

export class UpdatedCellDto {
  @ApiProperty({ example: 0 })
  x: number;

  @ApiProperty({ example: 0 })
  y: number;

  @ApiProperty({ enum: CellStatus })
  status: CellStatus;

  @ApiProperty({ required: false, example: false })
  isMine?: boolean;

  @ApiProperty({ required: false, example: 1 })
  neighboringBombCount?: number;
}

export class MoveResponseDto {
  @ApiProperty({ type: GameSummaryDto })
  game: GameSummaryDto;

  @ApiProperty({ type: [UpdatedCellDto] })
  updatedCells: UpdatedCellDto[];
}

/**
 * CreateGameDto - Input Validation
 *
 * Uses class-validator to enforce rules on game creation:
 * - rows/columns: Integers between 2 and 50.
 * - mineCount: Optional integer (min 1).
 *
 * These rules ensure legitimate grid sizes while preventing abuse/performance issues.
 */
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateGameDto {
  @IsInt()
  @Min(2)
  @Max(50)
  rows: number;

  @IsInt()
  @Min(2)
  @Max(50)
  columns: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  mineCount?: number;
}

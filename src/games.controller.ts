import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CellStatus } from './entities';
import {
  CreateGameDto,
  GameSummaryDto,
  ListGamesResponseDto,
  ListGamesQueryDto,
  MoveDto,
  MoveResponseDto,
} from './games.dto';
import { PAGINATION } from './config';

@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gameService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'List games' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiOkResponse({ type: ListGamesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid pagination' })
  async getAll(@Query() query: ListGamesQueryDto) {
    const limit = Math.min(
      query.limit ?? PAGINATION.defaultLimit,
      PAGINATION.maxLimit,
    );
    const offset = query.offset ?? 0;
    const [data, total] = await this.gameService.findAllGames(limit, offset);

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a game by id' })
  @ApiParam({ name: 'id', required: true, example: 'uuid' })
  @ApiOkResponse({ type: GameSummaryDto })
  @ApiBadRequestResponse({ description: 'Invalid id' })
  @ApiNotFoundResponse({ description: 'Game not found' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const game = await this.gameService.findOneGame(id);

    if (!game) {
      throw new NotFoundException(`Game with id "${id}" not found`);
    }

    return game;
  }

  @Post()
  @ApiOperation({ summary: 'Create a game' })
  @ApiBody({ type: CreateGameDto })
  @ApiOkResponse({ type: GameSummaryDto })
  @ApiBadRequestResponse({ description: 'Invalid board size' })
  async create(@Body() body: CreateGameDto) {
    const game = await this.gameService.createGame(body.rows, body.columns);

    return {
      id: game.id,
      rows: game.rows,
      columns: game.columns,
      status: game.status,
    };
  }

  @Post(':id/moves')
  @ApiOperation({ summary: 'Make a move (reveal)' })
  @ApiParam({ name: 'id', required: true, example: 'uuid' })
  @ApiBody({ type: MoveDto })
  @ApiOkResponse({ type: MoveResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Game not found' })
  async move(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: MoveDto) {
    const action = body.action ?? 'REVEAL';
    const { game, updatedCells } = await this.gameService.makeMove(
      id,
      body.x,
      body.y,
      action,
    );

    return {
      game: {
        id: game.id,
        rows: game.rows,
        columns: game.columns,
        status: game.status,
      },
      updatedCells: updatedCells.map((cell) => ({
        x: cell.xCoordinate,
        y: cell.yCoordinate,
        status: cell.status,
        isMine: cell.status === CellStatus.Detonated ? cell.isMine : undefined,
        neighboringBombCount:
          cell.status === CellStatus.Revealed
            ? cell.neighboringBombCount
            : undefined,
      })),
    };
  }
}

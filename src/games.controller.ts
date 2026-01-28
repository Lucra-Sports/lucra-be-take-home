/**
 * GamesController - API Endpoints for Minesweeper
 *
 * Implements the REST API interface for the game:
 * - POST /games: Creates a new game with customizable grid size and mine density.
 * - GET /games: Returns a lightweight list of all games (for browsing).
 * - GET /games/:id: Returns full game state including all cell data (for playing).
 *
 * Relies on GamesService for core logic and DTOs for input validation.
 */
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gameService: GamesService) {}

  @Get()
  async getAll() {
    return this.gameService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const game = await this.gameService.findOneGame(id);

    if (!game) {
      throw new NotFoundException(`Game with id "${id}" not found`);
    }

    return game;
  }

  @Post()
  async create(@Body() createGameDto: CreateGameDto) {
    return this.gameService.createGame(createGameDto);
  }
}

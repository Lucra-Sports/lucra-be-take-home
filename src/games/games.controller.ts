
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './create-game.dto';

@Controller('games')
export class GamesController {
  constructor(private readonly gameService: GamesService) {}

  @Get()
  async getAll() {
    return await this.gameService.findAllGames();
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
    const { rows, columns } = createGameDto;

    // Validate input
    if (!rows || !columns || rows < 1 || columns < 1) {
      throw new BadRequestException(
        'Both rows and columns must be positive integers'
      );
    }

    if (rows > 50 || columns > 50) {
      throw new BadRequestException(
        'Grid size too large. Maximum 50x50 allowed'
      );
    }

    try {
      const game = await this.gameService.createGame(rows, columns);
      return game;
    } catch (error) {
      throw new BadRequestException('Failed to create game');
    }
  }
}

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Game, GameCell } from './entities';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,

    @InjectRepository(GameCell)
    private gameCellsRepository: Repository<GameCell>,
  ) {}

  async findOneGame(id: string) {
    return this.gamesRepository.findOneBy({ id });
  }
}

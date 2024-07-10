import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Game } from 'src/entities/game.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
  ) {}

  async findOneGame(id: string) {
    return this.gamesRepository.findOneBy({ id });
  }
}

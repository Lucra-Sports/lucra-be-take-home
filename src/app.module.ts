import 'reflect-metadata';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesController } from './games/games.controller';
import { GamesService } from './games/games.service';
import { Game, GameCell } from './games/entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '0.0.0.0',
      port: 5432,
      username: 'local',
      password: 'local',
      database: 'local',
      entities: [join(__dirname, 'games/entities/*')],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Game, GameCell]),
  ],
  controllers: [GamesController],
  providers: [GamesService],
})

export class AppModule {}

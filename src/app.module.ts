import 'reflect-metadata';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { Game, GameCell } from './entities';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST as string,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER as string,
      password: process.env.DB_PASSWORD as string,
      database: process.env.DB_NAME as string,
      entities: [join(__dirname, 'entities/*')],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Game, GameCell]),
  ],
  controllers: [GamesController, HealthController],
  providers: [GamesService],
})

export class AppModule {}

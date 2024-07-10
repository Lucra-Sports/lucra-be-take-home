import 'reflect-metadata';
import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Game } from 'src/entities/game.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '0.0.0.0',
      port: 5432,
      username: 'local',
      password: 'local',
      database: 'local',
      entities: [join(__dirname, 'entities/*')],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Game]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  create() {
    throw new Error('Not implemented');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const game = await this.appService.findOneGame(id);

    if (!game) {
      throw new NotFoundException(`Game with id "${id}" not found`);
    }

    return game;
  }
}

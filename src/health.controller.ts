import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('health')
  @ApiOkResponse({ description: 'Service is healthy' })
  health() {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOkResponse({ description: 'Service is ready' })
  @ApiServiceUnavailableResponse({ description: 'Database not ready' })
  async ready() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ready' };
    } catch (error) {
      throw new ServiceUnavailableException('Database not ready');
    }
  }
}

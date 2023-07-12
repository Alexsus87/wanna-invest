import { Controller, Get, Query } from '@nestjs/common';
import { AppService, Filter } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData(@Query() filter: Filter) {
    return this.appService.getData(filter);
  }
}

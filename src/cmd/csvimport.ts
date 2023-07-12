import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CsvimportTask } from './csvimport.task';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('running csvimport task');

  await app.get(CsvimportTask).run();
}

bootstrap();

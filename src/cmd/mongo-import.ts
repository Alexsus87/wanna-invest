import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CsvimportTask } from './csvimport.task';
import { MongoImportTask } from './mongo-import.task';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('running mongoimport task');

  await app.get(MongoImportTask).run();
}

bootstrap();

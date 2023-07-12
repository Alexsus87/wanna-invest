import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CsvimportTask } from './csvimport.task';
import { MongoImportBlockTask } from './mongo-import-block.task';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('running mongoimport-block task');

  await app.get(MongoImportBlockTask).run();
}

bootstrap();

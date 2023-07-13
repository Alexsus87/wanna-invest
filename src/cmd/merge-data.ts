import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MergeDataTask } from './merge-data.task';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('running mongoimport task');

  await app.get(MergeDataTask).run();
}

bootstrap();

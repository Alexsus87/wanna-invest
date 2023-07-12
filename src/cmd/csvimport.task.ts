import {
  PropertiesData,
  PropertiesDataDocument,
} from '../schema/properties-data.schema';
import mongoose, { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import * as process from 'process';
import { randomUUID } from 'crypto';
import { chunk } from 'lodash';

@Injectable()
export class CsvimportTask {
  constructor(
    @InjectModel(PropertiesData.name)
    protected readonly propertiesData: Model<PropertiesDataDocument>,
  ) {}

  async run() {
    console.log('reading json');

    const json = fs.readFileSync(__dirname + '/realtor-data.json', 'utf8');

    const data = JSON.parse(json);

    console.log('data size', data.length);

    const chunks = chunk(data, 1000);

    for (const [i, items] of chunks.entries()) {
      const dataToSave = items.map((item) => ({
        _id: new mongoose.Types.ObjectId(),
        ...item,
      }));

      console.log(`saving chunk ${i} out of ${chunks.length}`);

      await this.propertiesData.create(dataToSave);
    }
  }
}

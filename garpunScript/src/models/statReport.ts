import {
    Model, DataTypes,
    InferAttributes, InferCreationAttributes
} from 'sequelize';

import { mainDbConnection } from '../db/dbConnect';

export interface StatReports extends Model<InferAttributes<StatReports>, InferCreationAttributes<StatReports>> {
    [key:string] : any;
    // id: CreationOptional<number>;
    reportData:string;
  }

export const StatReportModel = mainDbConnection.define<StatReports>('statReports', {
    reportData: {
        type: DataTypes.STRING,
    },
});

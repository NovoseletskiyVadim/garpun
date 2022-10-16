import {
    Model, DataTypes,
    InferAttributes, InferCreationAttributes
} from 'sequelize';

import { cashReqDbConnection } from '../db/dbConnect';

export interface PendingList extends Model<InferAttributes<PendingList>, InferCreationAttributes<PendingList>> {
    [key:string] : any;
    // id: CreationOptional<number>;
    status:string;
    data: JSON;
    dbID: string;
    fileMeta: JSON;
    calcAttempts: number;
  }

export const PendingEventModel = cashReqDbConnection.define<PendingList>('pendingList', {
    status: {
        type: DataTypes.STRING,
    },
    data: {
        type: DataTypes.JSON,
    },
    dbID: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
    },
    fileMeta: {
        type: DataTypes.JSON,
    },
    calcAttempts: {
        type: DataTypes.NUMBER,
        defaultValue: 0,
    },
});

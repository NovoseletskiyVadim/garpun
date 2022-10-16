import {
    Model, DataTypes,
    InferAttributes, InferCreationAttributes
} from 'sequelize';

import { mainDbConnection } from '../db/dbConnect';

export interface CamEvent extends Model<InferAttributes<CamEvent>, InferCreationAttributes<CamEvent>> {
    [key:string] : any;
    // id: CreationOptional<number>;
    uuid:string;
    time: Date;
    license_plate_number: string;
    uploaded: boolean;
    camera: string;
    apiResponse: string;
    fileName: string;
    fileErrors: symbol;
  }

export const CamEventModel = mainDbConnection.define<CamEvent>('camEvents', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
    },
    time: {
        type: DataTypes.DATE,
    },
    license_plate_number: {
        type: DataTypes.STRING,
    },
    uploaded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    camera: {
        type: DataTypes.STRING,
    },
    apiResponse: {
        type: DataTypes.JSON,
    },
    fileName: {
        type: DataTypes.STRING,
    },
    fileErrors: {
        type: DataTypes.STRING,
    },
});

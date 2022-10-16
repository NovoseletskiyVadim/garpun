import {
    Model, DataTypes,
    InferAttributes, InferCreationAttributes
} from 'sequelize';

import { mainDbConnection } from '../db/dbConnect';

export interface Camera extends Model<InferAttributes<Camera>, InferCreationAttributes<Camera>> {
    [key:string] : any;
    // id: CreationOptional<number>;
    uuid:string;
    ftpHomeDir: string;
    ftpPassword: string;
    name: string;
    position: string;
    cameraIP: string;
    isOnLine: string;
  }

export const CameraModel = mainDbConnection.define<Camera>('cameras', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
    },
    ftpHomeDir: {
        type: DataTypes.STRING,
    },
    ftpPassword: {
        type: DataTypes.STRING,
    },
    name: {
        type: DataTypes.STRING,
    },
    position: {
        type: DataTypes.STRING,
    },
    cameraIP: {
        type: DataTypes.STRING,
    },
    isOnLine: {
        type: DataTypes.BOOLEAN,
    },
});

import {
    Model, DataTypes,
    InferAttributes, InferCreationAttributes
} from 'sequelize';

import { mainDbConnection } from '../db/dbConnect';

export interface User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    [key:string] : any;
    // id: CreationOptional<number>;
    userLogin:string;
    userPassword: string;
    userRole: string;
  }

export const UserModel = mainDbConnection.define<User>('users', {
    userLogin: {
        type: DataTypes.STRING,
    },
    userPassword: {
        type: DataTypes.STRING,
    },
    userRole: {
        type: DataTypes.STRING,
    },
    chatID: {
        type: DataTypes.NUMBER,
    },
    chatMsgOn: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
});

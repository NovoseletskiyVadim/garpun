/* eslint-disable global-require */
import  path from 'path';

import { Sequelize } from 'sequelize';

import { appLogger } from '../logger/appLogger';
import appConfig from '../common/config';
// import { CamEventModel } from '../models/camEvent';
// import { CameraModel } from '../models/camera';
// import { UserModel } from '../models/user';
// import { StatReportModel } from '../models/statReport';
// import { PendingEventModel } from '../models/pendingEvent';

const mainDbPath = appConfig.MAIN_DB_PATH || path.join(__dirname, './../../dataBase/main.db');
const cashDbPath = appConfig.TEMP_DB_PATH || path.join(__dirname, './../../dataBase/temp.db');

export const mainDbConnection = new Sequelize({
    dialect: 'sqlite',
    storage: mainDbPath,
    logging: false, // Disables logging
});

export const cashReqDbConnection = new Sequelize({
    dialect: 'sqlite',
    storage: cashDbPath,
    logging: false, // Disables logging
});

export const connectionTest = async () => {
        const main = mainDbConnection.authenticate();
        const cash = cashReqDbConnection.authenticate();
        try {
            await Promise.all([main, cash]);
            appLogger.setLogMessage(
                `mainDbPath:${mainDbPath}\ncashDbPath:${cashDbPath}`
            ).appInfoMessage();

            appLogger.setLogMessage('Connections with data bases OK').appInfoMessage();

        } catch (error) {
            console.error(error);
        }

};

export const stopDbConnections = () => {
    mainDbConnection.close();
    cashReqDbConnection.close();
};

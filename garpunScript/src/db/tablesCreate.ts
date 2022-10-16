import { CameraModel } from '../models/camera';
import { CamEventModel } from '../models/camEvent';
import { PendingEventModel } from '../models/pendingEvent';
import { StatReportModel } from '../models/statReport';
import { UserModel } from '../models/user';

export const dbTablesCreate = async () => {

    let tablesList: any[] = [];

    // if NODE_ENV === 'DEV' clean test DB table PendingList and CamEvents

    if (process.env.NODE_ENV === 'DEV') {
        tablesList = [
            // CameraModel.sync({ alter: true }),
            // CamEventModel.sync({ force: true }),
            // PendingEventModel.sync({ force: true }),
            // UserModel.sync({ alter: true }),
            // StatReportModel.sync({ alter: true }),
        ];
    } else {
        tablesList = [
            CameraModel.sync({ alter: true }),
            CamEventModel.sync({ alter: true }),
            PendingEventModel.sync({ alter: true }),
            UserModel.sync({ alter: true }),
            StatReportModel.sync({ alter: true }),
        ];
    }

    try {
        await Promise.all(tablesList);
    } catch (error) {
        console.error(error);
    }
};

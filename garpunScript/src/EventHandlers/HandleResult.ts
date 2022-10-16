import { v4 as uuIdv4 } from 'uuid';
import fs from 'fs';

import { FileStatHandlerResult } from './fileExplorerTypes';
import { CamEventModel, CamEvent } from '../models/camEvent';
import { Camera, CameraModel } from '../models/camera';
import internal from 'node:stream';

export class HandleResult {
    private statHandlerResult:FileStatHandlerResult = {
        fileStat: null,
        cameraName: null,
        fileName: null,
        plateNumber: null,
        eventDate: null,
        fileType: null,
    };

    private eventUuid = uuIdv4();

    private fileInBase64:string | null = null;

    private cameraInstance: null | Camera = null;

    public handleSteps: Array<string> = [];

    public handleIssues:Array<string> = [];

    public moduleName: string;

    public dbInstance: null | CamEvent = null;

    public fileReadStream: null | fs.ReadStream = null;

    public readFileStreamCompressed: internal.Readable | null = null;

    public filePath: string;

    constructor(moduleName:string, filePath: string) {
        this.moduleName = moduleName;
        this.filePath = filePath;
    }

    public setFileStatInfo (handleResult:FileStatHandlerResult) {
        this.statHandlerResult = { ...handleResult };
    }

    public setFileInBase64 (streamBuffer:Array<any>) {
        this.fileInBase64 = Buffer.concat(streamBuffer).toString('base64');
    }

    public badFileMessage():string {
        return `[${this.moduleName}] issues:${this.handleIssues.join(' ')} camera:${
            this.statHandlerResult.cameraName
            } file:${this.fileNameWithExt}`;
    }

    get cameraName():string {
        const { cameraName } =  this.statHandlerResult;
        if (!cameraName) throw new Error('Empty cameraName');
        return cameraName;
    }

    get fileNameWithExt() {
        return `${this.statHandlerResult.fileName}${this.statHandlerResult.fileType}`;
    }

    get fileSize(): number {
        const size = this.statHandlerResult.fileStat?.size;
        if (!size) throw new Error('No file size value');
        return size;
    }

    async createInDb ():Promise<void> {
        const dataToLocalDB = {
            uuid: this.eventUuid,
            time: this.statHandlerResult.eventDate,
            license_plate_number: this.statHandlerResult.plateNumber,
            camera: this.statHandlerResult.cameraName,
            fileName: this.fileNameWithExt,
            fileErrors: this.handleIssues.join(),
        };

        this.dbInstance = await CamEventModel.create(dataToLocalDB);
    }

    async updateInDb (value: Partial<CamEvent>):Promise<void> {
        const { dbInstance } = this;
        if (dbInstance) {
                Object.keys(value).forEach(keyName => {
                    dbInstance[keyName] = value[keyName];
                });
                await dbInstance.save();
                return;
        }
        throw new Error('Event db instance null');
    }

    async fetchCameraInfo (): Promise<void> {
        const { cameraName } = this.statHandlerResult;
        if (cameraName) {

            const findResult = await CameraModel.findOne({
                where: { ftpHomeDir: cameraName },
            });

            if (!findResult) throw new Error('Camera not found');

            this.cameraInstance = findResult;
        }
    }

    get cameraPosition(): {lat:number, long: number} {
        const arrayPosition = this.cameraInstance?.position.split(',');
        if (!arrayPosition)  throw new Error('Check camera position');
        return {
            lat: parseFloat(arrayPosition[0]),
            long: parseFloat(arrayPosition[1]),
        };
    }

    get eventDate() {
        return this.statHandlerResult.eventDate;
    }

    prepareJsonToSend ():string {

        const eventObject = {
            version: 1,
            provider:
                process.env.PROVIDER || new Error('PROVIDER is not set'),
            data: {
                device: {
                    id: this.cameraInstance?.uuid || new Error(
                                `CAMERA_INFO ${this.statHandlerResult.cameraName} UUID is not set`
                            ),
                    name: this.cameraInstance?.name || new Error(
                        `CAMERA_INFO ${this.statHandlerResult.cameraName} NAME is not set`
                    )

                },
                event: {
                    id: this.eventUuid,
                    datetime: this.statHandlerResult.eventDate,
                    latitude: this.cameraPosition.lat,
                    longitude: this.cameraPosition.long,
                    params: [],
                    vehicle: {
                        licensePlate: {
                            value: this.statHandlerResult.plateNumber,
                            country: null,
                            region: null,
                        },
                        params: [],
                    },
                    media: [
                        {
                            id: uuIdv4(),
                            data: this.fileInBase64,
                            url: null,
                            plate: {
                                data: null,
                                url: null,
                            },
                        },
                    ],
                },
            },
        };
        return JSON.stringify(eventObject);
    }

    get readStream ():fs.ReadStream | internal.Readable  {
        const { fileReadStream, readFileStreamCompressed } = this;

        let readStream: fs.ReadStream | internal.Readable;

        if (readFileStreamCompressed) {
            readStream = readFileStreamCompressed;
        } else if (fileReadStream) {
            readStream = fileReadStream;
        } else {
            this.fileReadStream = fs.createReadStream(this.filePath);
            readStream = this.fileReadStream;
        }

        return readStream;
    }

    get plateNumber():string {
        const { plateNumber } = this.statHandlerResult;
        if (!plateNumber) throw new Error('Empty plateNumber');
        return plateNumber;
    }
}

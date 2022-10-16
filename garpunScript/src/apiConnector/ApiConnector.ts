import axios from 'axios';
import appConfig from '../common/config';
import { JsonSenderError } from '../errorHandlers/jsonSenderError';

export type SendDataResult = {
    isSent: boolean,
    apiResponse: Record<string, any>,
}

type ReqConfig = {
    timeout: number,
    headers: Record<any, any>,
}

export class ApiConnector {
    url:string;

    reqConfig: ReqConfig;

    requestData: string;

    constructor(requestData: string) {
        this.requestData = requestData;
        this.url = appConfig.API_SERVER_URL;
        this.reqConfig = {
            headers: {
                'Content-type': ' application/json; charset=utf-8',
                Authentication: appConfig.API_KEY,
            },
            timeout: appConfig.REQUEST_TIMEOUT,
        };
    }

    async sendData(): Promise<SendDataResult> {
        const { data, config  } = await axios.post<Record<string, any>>(this.url, this.requestData, this.reqConfig);
        const { status, error } = data;
        let isSent = false;

        if (status && status === 'OK') {
            isSent = true;
        }

        if (!error && !status) {
            const errorMsg = {
                config,
                response: {
                    statusText: 'UNEXPECTED_RES_TYPE',
                    status: 200,
                },
            };
            throw new JsonSenderError(errorMsg);
        }

        return {
            isSent,
            apiResponse: data
        };
    }
}

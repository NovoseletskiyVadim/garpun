import { spawn } from 'child_process';

import { BaseHandler, ExecuteCommands } from './BaseHandler';
import { maxFileSize }  from './FileHandler.config.json';
import { FilesTypes } from './FileRouter';

export class FileSizeHandler extends BaseHandler {

    private readonly maxFileSize:number = maxFileSize;

    handleStepName = 'CHK_FILE_SIZE';

    async execute():Promise<void> {

        this.handleResult.handleSteps.push(this.handleStepName);

        const compressionLevel = this.calcCompressionLevel;

        if (compressionLevel === null) {
            this.handleResult.handleIssues.push(`FILE_SIZE_${this.handleResult.fileSize}`);
            this.stopHandling([this.getFinalCommand(FilesTypes.TRASH), ExecuteCommands.SAVE_IN_DB, ExecuteCommands.BAD_FILE_MSG]);
        } else if (compressionLevel > 0) {
            const ffmpegTransformProcess =  spawn('C:\\Users\\Alex_Bu\\Downloads\\ffmpeg-2022-06-30-git-03b2ed9a50-essentials_build\\bin\\ffmpeg.exe', ['-f', 'image2pipe', '-i', 'pipe:0', '-loglevel', 'error', '-qscale:v', `${compressionLevel}`, '-f', 'image2pipe', 'pipe:1'],{
                stdio: ['pipe','pipe', process.stderr] //process.stderr'pipe' '-loglevel', 'error',
            });
            this.handleResult.handleSteps.push(`COMPRESSED-${this.getCompressionLevelName(compressionLevel)}`);
            this.handleResult.readStream.pipe(ffmpegTransformProcess.stdin);

            this.handleResult.readFileStreamCompressed = ffmpegTransformProcess.stdout;

        }

        await super.execute();
    }

    get calcCompressionLevel (): number | null {
        const size  = this.handleResult?.fileSize;
        if (size) {
            const coefficient =   (size / this.maxFileSize) * 100;

            switch (true) {
                case coefficient <= 100:
                    return 0;
                case coefficient < 140:
                   return 6;
                case (coefficient < 175):
                    return 32;
                default:
                    break;
            }
        }

        return null;
    }

    getCompressionLevelName(level:number): string {
        const compressionLevels = [
            { level: 6, name: '10%'  },
            { level: 10, name: '40%'  },
            { level: 32, name: '75%' },
            { level: 100, name: 'TRASH' },
         ];
        return  compressionLevels.find(levelInfo => levelInfo.level === level)?.name ?? '';
    }
}

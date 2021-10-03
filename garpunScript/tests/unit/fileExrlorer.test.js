const fs = require('fs');
const path = require('path');
const fsp = require('fs').promises;

const expect = require('chai').expect;
const moment = require('moment');
const should = require('chai').should();

require('dotenv').config();
const ARCHIVE_DAYS = 5;
process.env.ARCHIVE_DAYS = ARCHIVE_DAYS;
const cameraName = 'test_cam_ok';
const fileExplorer = require('./../../src/utils/fileExplorer/fileExplorer');
const pathToArchive = path.join(process.env['ARCHIVE_DIR'], cameraName);
const pathToTrash = path.join(process.env['TRASH_DIR'], cameraName);
const etalonFilePath = path.join(__dirname, `../test_media/fileOK.jpg`);
const pathToTestFile = path.join(__dirname, `../test_media/testFile.jpg`);

describe('Test fileExplorer', function () {
    describe('Test cases if archive 5 days', () => {
        describe('Test oldFilesCleaner', () => {
            describe('Case if empty folder', () => {
                let folders = [];
                it('No folder to clean in ARCHIVE', (done) => {
                    fileExplorer
                        .oldFilesCleaner(cameraName, 'ARCHIVE')
                        .then((res) => {
                            console.log(res);
                            folders.forEach((folderPath) => {
                                expect(fs.existsSync(folderPath)).to.be.true;
                            });
                            expect(res).to.equal(
                                `ARCHIVE for ${cameraName} nothing to clean`
                            );
                            done();
                        })
                        .catch(console.error);
                });

                it('No folder to clean in TRASH', (done) => {
                    fileExplorer
                        .oldFilesCleaner(cameraName, 'TRASH')
                        .then((res) => {
                            console.log(res);
                            folders.forEach((folderPath) => {
                                expect(fs.existsSync(folderPath)).to.be.true;
                            });
                            expect(res).to.equal(
                                `TRASH for ${cameraName} nothing to clean`
                            );
                            done();
                        })
                        .catch(console.error);
                });

                it('Folder with name XXX not exist in TRASH', (done) => {
                    fileExplorer
                        .oldFilesCleaner('XXX', 'TRASH')
                        .then((res) => {
                            console.log(res);
                            folders.forEach((folderPath) => {
                                expect(fs.existsSync(folderPath)).to.be.true;
                            });
                            expect(res).to.equal(
                                'TRASH for XXX nothing to clean'
                            );
                            done();
                        })
                        .catch(console.error);
                });
            });

            describe('Folder does not have files older than archiveDays', function () {
                let folders = [];
                before(() => {
                    const calcTestFolders = 5;
                    for (let index = 0; index < calcTestFolders; index++) {
                        const folderName = moment()
                            .subtract(index, 'days')
                            .format('YYYYMMDD');
                        const toArchive = path.join(pathToArchive, folderName);
                        const toTrash = path.join(pathToTrash, folderName);
                        folders.push(toArchive, toTrash);
                    }
                    const createList = folders.map((folderPath) => {
                        if (!fs.existsSync(folderPath)) {
                            return fsp.mkdir(folderPath);
                        }
                        return true;
                    });
                    return Promise.all(createList).then(() => {
                        folders.forEach((folderPath) => {
                            expect(fs.existsSync(folderPath)).to.be.true;
                        });
                        return true;
                    });
                });

                it('No folder older then archiveDays in TRASH', (done) => {
                    fileExplorer
                        .oldFilesCleaner('test_cam_ok', 'TRASH')
                        .then((res) => {
                            folders.forEach((folderPath) => {
                                expect(fs.existsSync(folderPath)).to.be.true;
                            });
                            expect(res).to.equal(
                                'TRASH for test_cam_ok nothing to clean'
                            );
                            done();
                        })
                        .catch(console.error);
                });

                it('No folder older then archiveDays in ARCHIVE', (done) => {
                    fileExplorer
                        .oldFilesCleaner(cameraName, 'ARCHIVE')
                        .then((res) => {
                            folders.forEach((folderPath) => {
                                expect(fs.existsSync(folderPath)).to.be.true;
                            });
                            expect(res).to.equal(
                                `ARCHIVE for ${cameraName} nothing to clean`
                            );
                            done();
                        })
                        .catch(console.error);
                });

                after(() => {
                    try {
                        folders.forEach((folderPath) => {
                            fs.rmdirSync(folderPath);
                        });
                    } catch (error) {
                        console.error(error);
                    }
                });
            });

            describe('Folder has files older then archiveDays', () => {
                let folders = [];
                before(() => {
                    const calcTestFolders = 8;
                    for (let index = 0; index < calcTestFolders; index++) {
                        const folderName = moment()
                            .subtract(index, 'days')
                            .format('YYYYMMDD');
                        const toArchive = path.join(pathToArchive, folderName);
                        const toTrash = path.join(pathToTrash, folderName);
                        folders.push(toArchive, toTrash);
                    }
                    const createList = folders.map((folderPath) => {
                        if (!fs.existsSync(folderPath)) {
                            return fsp.mkdir(folderPath);
                        }
                        return true;
                    });
                    return Promise.all(createList).then(() => {
                        folders.forEach((folderPath) => {
                            expect(fs.existsSync(folderPath)).to.be.true;
                        });
                        return true;
                    });
                });

                it('Delete older files in ARCHIVE', (done) => {
                    fileExplorer
                        .oldFilesCleaner(cameraName, 'ARCHIVE')
                        .then((res) => {
                            const foldersInArch = fs.readdirSync(pathToArchive);
                            expect(foldersInArch.length).equal(ARCHIVE_DAYS);
                            for (
                                let index = 0;
                                index < ARCHIVE_DAYS;
                                index += 1
                            ) {
                                const dayName = moment()
                                    .subtract(index, 'days')
                                    .format('YYYYMMDD');
                                expect(foldersInArch.includes(dayName)).to.be
                                    .true;
                            }
                            done();
                        })
                        .catch(console.error);
                });

                it('Older folder in Trash', (done) => {
                    fileExplorer
                        .oldFilesCleaner(cameraName, 'TRASH')
                        .then((res) => {
                            const foldersInArch = fs.readdirSync(pathToTrash);
                            expect(foldersInArch.length).equal(ARCHIVE_DAYS);
                            for (
                                let index = 0;
                                index < ARCHIVE_DAYS;
                                index += 1
                            ) {
                                const dayName = moment()
                                    .subtract(index, 'days')
                                    .format('YYYYMMDD');
                                expect(foldersInArch.includes(dayName)).to.be
                                    .true;
                            }
                            done();
                        })
                        .catch(console.error);
                });

                after(() => {
                    try {
                        const foldersInArch = fs.readdirSync(pathToArchive);
                        const foldersInTrash = fs.readdirSync(pathToTrash);

                        foldersInArch.forEach((element) => {
                            fs.rmdirSync(path.join(pathToArchive, element), {
                                recursive: true,
                            });
                        });

                        foldersInTrash.forEach((element) => {
                            fs.rmdirSync(path.join(pathToTrash, element), {
                                recursive: true,
                            });
                        });
                    } catch (error) {
                        console.error(error);
                    }
                });
            });
        });

        describe('Test setFileDirPath', () => {
            it('Create new folder in ARCHIVE', (done) => {
                const result = fileExplorer.getFileDirPath(
                    cameraName,
                    'ARCHIVE'
                );
                expect(result.isNewFolder).to.be.true;
                expect(fs.existsSync(result.folderPath)).to.be.true;
                done();
            });

            it('Folder exits in ARCHIVE', (done) => {
                const result = fileExplorer.getFileDirPath(
                    cameraName,
                    'ARCHIVE'
                );
                expect(result.isNewFolder).to.be.false;
                expect(fs.existsSync(result.folderPath)).to.be.true;
                done();
            });

            it('Create new folder in ARCHIVE', (done) => {
                const result = fileExplorer.getFileDirPath(cameraName, 'TRASH');
                expect(result.isNewFolder).to.be.true;
                expect(fs.existsSync(result.folderPath)).to.be.true;
                done();
            });

            it('Folder exits in ARCHIVE', (done) => {
                const result = fileExplorer.getFileDirPath(cameraName, 'TRASH');
                expect(result.isNewFolder).to.be.false;
                expect(fs.existsSync(result.folderPath)).to.be.true;
                done();
            });

            after(() => {
                try {
                    const foldersInArch = fs.readdirSync(pathToArchive);
                    const foldersInTrash = fs.readdirSync(pathToTrash);

                    foldersInArch.forEach((element) => {
                        fs.rmdirSync(path.join(pathToArchive, element), {
                            recursive: true,
                        });
                    });

                    foldersInTrash.forEach((element) => {
                        fs.rmdirSync(path.join(pathToTrash, element), {
                            recursive: true,
                        });
                    });
                } catch (error) {
                    console.error(error);
                }
            });
        });

        describe('Test base64Convertor', function () {
            describe('Test base64Convertor should add new folder in archive', function () {
                before(() => {
                    return new Promise((resolve) => {
                        const readStr = fs.ReadStream(etalonFilePath);

                        const writeStr = fs.WriteStream(pathToTestFile);
                        readStr.pipe(writeStr);

                        writeStr.on('close', () => {
                            resolve();
                        });
                    });
                });

                it('Data and etalonFile file should be same file should be saved in archive folder', function () {
                    const eventData = {
                        cameraName,
                        file: {
                            fullPath: pathToTestFile,
                            name: 'testFile',
                            ext: '.jpg',
                        },
                    };

                    const dayName = moment().format('YYYYMMDD');

                    const inArchiveFilePath = path.join(
                        pathToArchive,
                        dayName,
                        eventData.file.name + eventData.file.ext
                    );

                    return fileExplorer
                        .base64Convertor(eventData)
                        .then((data) => {
                            const buff = Buffer.from(data, 'base64');
                            var etalonBuf = fs.readFileSync(etalonFilePath);
                            buff.compare(etalonBuf).should.be.equal(0);
                            expect(fs.existsSync(pathToTestFile)).to.be.false;
                            expect(fs.existsSync(inArchiveFilePath)).to.be.true;
                            return true;
                        });
                });

                after(() => {
                    try {
                        const foldersInArch = fs.readdirSync(pathToArchive);
                        const foldersInTrash = fs.readdirSync(pathToTrash);

                        foldersInArch.forEach((element) => {
                            fs.rmdirSync(path.join(pathToArchive, element), {
                                recursive: true,
                            });
                        });

                        foldersInTrash.forEach((element) => {
                            fs.rmdirSync(path.join(pathToTrash, element), {
                                recursive: true,
                            });
                        });
                    } catch (error) {
                        console.error(error);
                    }
                });
            });

            describe('Test base64Convertor should delete old folders', function () {
                let folders = [];
                before(() => {
                    const calcTestFolders = 8;
                    for (let index = 1; index < calcTestFolders; index++) {
                        const folderName = moment()
                            .subtract(index, 'days')
                            .format('YYYYMMDD');
                        const toArchive = path.join(pathToArchive, folderName);
                        folders.push(toArchive);
                    }
                    const createList = folders.map((folderPath) => {
                        if (!fs.existsSync(folderPath)) {
                            return fsp.mkdir(folderPath);
                        }
                        return true;
                    });
                    return Promise.all(createList).then(() => {
                        folders.forEach((folderPath) => {
                            expect(fs.existsSync(folderPath)).to.be.true;
                        });
                        return new Promise((resolve) => {
                            const readStr = fs.ReadStream(etalonFilePath);

                            const writeStr = fs.WriteStream(pathToTestFile);
                            readStr.pipe(writeStr);

                            writeStr.on('close', () => {
                                resolve();
                            });
                        });
                    });
                });

                it('Data and etalonFile file should be same file should be in archive folder', function () {
                    const eventData = {
                        cameraName,
                        file: {
                            fullPath: pathToTestFile,
                            name: 'testFile',
                            ext: '.jpg',
                        },
                    };

                    const dayName = moment().format('YYYYMMDD');

                    const inArchiveFilePath = path.join(
                        pathToArchive,
                        dayName,
                        eventData.file.name + eventData.file.ext
                    );

                    return fileExplorer
                        .base64Convertor(eventData)
                        .then((data) => {
                            const buff = Buffer.from(data, 'base64');
                            var etalonBuf = fs.readFileSync(etalonFilePath);
                            buff.compare(etalonBuf).should.be.equal(0);
                            expect(fs.existsSync(pathToTestFile)).to.be.false;
                            //set timeout?
                            expect(fs.existsSync(inArchiveFilePath)).to.be.true;
                            const foldersInArch = fs.readdirSync(pathToArchive);
                            expect(foldersInArch.length).equal(ARCHIVE_DAYS);
                            for (
                                let index = 0;
                                index < ARCHIVE_DAYS;
                                index += 1
                            ) {
                                const dayName = moment()
                                    .subtract(index, 'days')
                                    .format('YYYYMMDD');
                                expect(foldersInArch.includes(dayName)).to.be
                                    .true;
                            }
                            return true;
                        });
                });

                after(() => {
                    try {
                        const foldersInArch = fs.readdirSync(pathToArchive);
                        const foldersInTrash = fs.readdirSync(pathToTrash);

                        foldersInArch.forEach((element) => {
                            fs.rmdirSync(path.join(pathToArchive, element), {
                                recursive: true,
                            });
                        });

                        foldersInTrash.forEach((element) => {
                            fs.rmdirSync(path.join(pathToTrash, element), {
                                recursive: true,
                            });
                        });
                    } catch (error) {
                        console.error(error);
                    }
                });
            });
        });

        describe('Test rejectFileHandler ', () => {
            describe('Test with trash archive on should add new folder in archive', function () {
                before(() => {
                    return new Promise((resolve) => {
                        const readStr = fs.ReadStream(etalonFilePath);

                        const writeStr = fs.WriteStream(pathToTestFile);
                        readStr.pipe(writeStr);

                        writeStr.on('close', () => {
                            resolve();
                        });
                    });
                });

                it('Data and etalonFile file should be same file should be saved in archive folder', function () {
                    const fileMeta = {
                        cameraName,
                        file: {
                            fullPath: pathToTestFile,
                            name: 'testFile',
                            ext: '.jpg',
                        },
                    };

                    const dayName = moment().format('YYYYMMDD');

                    const inArchiveFilePath = path.join(
                        pathToTrash,
                        dayName,
                        fileMeta.file.name + fileMeta.file.ext
                    );

                    return fileExplorer.rejectFileHandler(fileMeta).then(() => {
                        expect(fs.existsSync(pathToTestFile)).to.be.false;
                        expect(fs.existsSync(inArchiveFilePath)).to.be.true;
                        return true;
                    });
                });

                after(() => {
                    try {
                        const foldersInTrash = fs.readdirSync(pathToTrash);

                        foldersInTrash.forEach((element) => {
                            fs.rmdirSync(path.join(pathToTrash, element), {
                                recursive: true,
                            });
                        });
                    } catch (error) {
                        console.error(error);
                    }
                });
            });

            describe('Test should delete old folders', function () {
                let folders = [];
                before(() => {
                    const calcTestFolders = 8;
                    for (let index = 1; index < calcTestFolders; index++) {
                        const folderName = moment()
                            .subtract(index, 'days')
                            .format('YYYYMMDD');
                        const toArchive = path.join(pathToTrash, folderName);
                        folders.push(toArchive);
                    }
                    const createList = folders.map((folderPath) => {
                        if (!fs.existsSync(folderPath)) {
                            return fsp.mkdir(folderPath);
                        }
                        return true;
                    });
                    return Promise.all(createList).then(() => {
                        folders.forEach((folderPath) => {
                            expect(fs.existsSync(folderPath)).to.be.true;
                        });
                        return new Promise((resolve) => {
                            const readStr = fs.ReadStream(etalonFilePath);

                            const writeStr = fs.WriteStream(pathToTestFile);
                            readStr.pipe(writeStr);

                            writeStr.on('close', () => {
                                resolve();
                            });
                        });
                    });
                });

                it('File should be save in archive folder', function () {
                    const eventData = {
                        cameraName,
                        file: {
                            fullPath: pathToTestFile,
                            name: 'testFile',
                            ext: '.jpg',
                        },
                    };

                    const dayName = moment().format('YYYYMMDD');

                    const inArchiveFilePath = path.join(
                        pathToTrash,
                        dayName,
                        eventData.file.name + eventData.file.ext
                    );

                    return fileExplorer
                        .rejectFileHandler(eventData)
                        .then(() => {
                            expect(fs.existsSync(pathToTestFile)).to.be.false;
                            //set timeout?
                            expect(fs.existsSync(inArchiveFilePath)).to.be.true;
                            const foldersInArch = fs.readdirSync(pathToTrash);
                            expect(foldersInArch.length).equal(ARCHIVE_DAYS);
                            for (
                                let index = 0;
                                index < ARCHIVE_DAYS;
                                index += 1
                            ) {
                                const dayName = moment()
                                    .subtract(index, 'days')
                                    .format('YYYYMMDD');
                                expect(foldersInArch.includes(dayName)).to.be
                                    .true;
                            }
                            return true;
                        });
                });

                after(() => {
                    try {
                        const foldersInArch = fs.readdirSync(pathToArchive);
                        const foldersInTrash = fs.readdirSync(pathToTrash);

                        foldersInArch.forEach((element) => {
                            fs.rmdirSync(path.join(pathToArchive, element), {
                                recursive: true,
                            });
                        });

                        foldersInTrash.forEach((element) => {
                            fs.rmdirSync(path.join(pathToTrash, element), {
                                recursive: true,
                            });
                        });
                    } catch (error) {
                        console.error(error);
                    }
                });
            });
        });
    });

    describe('Test case if archive OFF', () => {
        //Test this case separate from other tests set ARCHIVE_DAYS = 0 days
        it('Data and etalonFile file should be same file should not be in archive folder', (done) => {
            console.log(
                'Test this case separate from other tests set ARCHIVE_DAYS = 0 days!!!'
            );
            done();
        });

        // describe('Test base64Convertor archive OFF', function () {
        //     before(() => {
        //         return new Promise((resolve) => {
        //             const readStr = fs.ReadStream(etalonFilePath);
        //             const writeStr = fs.WriteStream(pathToTestFile);
        //             readStr.pipe(writeStr);
        //             writeStr.on('close', () => {
        //                 resolve();
        //             });
        //         });
        //     });
        //     it('Data and etalonFile file should be same file should not be in archive folder', function () {
        //         const eventData = {
        //             cameraName,
        //             file: {
        //                 fullPath: pathToTestFile,
        //                 name: 'testFile',
        //                 ext: '.jpg',
        //             },
        //         };
        //         const dayName = moment().format('YYYYMMDD');
        //         const inArchiveFilePath = path.join(
        //             pathToArchive,
        //             dayName,
        //             eventData.file.name + eventData.file.ext
        //         );
        //         return fileExplorer.base64Convertor(eventData).then((data) => {
        //             const buff = Buffer.from(data, 'base64');
        //             var etalonBuf = fs.readFileSync(etalonFilePath);
        //             buff.compare(etalonBuf).should.be.equal(0);
        //             expect(fs.existsSync(pathToTestFile)).to.be.false;
        //             //set timeout?
        //             expect(fs.existsSync(inArchiveFilePath)).to.be.false;
        //             const foldersInArch = fs.readdirSync(pathToArchive);
        //             expect(foldersInArch.length).equal(0);
        //             return true;
        //         });
        //     });
        //     after(() => {
        //         try {
        //             const foldersInArch = fs.readdirSync(pathToArchive);
        //             foldersInArch.forEach((element) => {
        //                 fs.rmdirSync(path.join(pathToArchive, element), {
        //                     recursive: true,
        //                 });
        //             });
        //         } catch (error) {
        //             console.error(error);
        //         }
        //     });
        // });

        // describe('Test rejectFileHandler archive OFF', () => {
        //     before(() => {
        //         return new Promise((resolve) => {
        //             const readStr = fs.ReadStream(etalonFilePath);

        //             const writeStr = fs.WriteStream(pathToTestFile);
        //             readStr.pipe(writeStr);

        //             writeStr.on('close', () => {
        //                 resolve();
        //             });
        //         });
        //     });

        //     it('Data and etalonFile file should be same file should be saved in archive folder', function () {
        //         const fileMeta = {
        //             cameraName,
        //             file: {
        //                 fullPath: pathToTestFile,
        //                 name: 'testFile',
        //                 ext: '.jpg',
        //             },
        //         };

        //         const dayName = moment().format('YYYYMMDD');

        //         const inArchiveFilePath = path.join(
        //             pathToTrash,
        //             dayName,
        //             fileMeta.file.name + fileMeta.file.ext
        //         );

        //         return fileExplorer.rejectFileHandler(fileMeta).then(() => {
        //             expect(fs.existsSync(pathToTestFile)).to.be.false;
        //             expect(fs.existsSync(inArchiveFilePath)).to.be.false;
        //             return true;
        //         });
        //     });

        //     after(() => {
        //         try {
        //             const foldersInTrash = fs.readdirSync(pathToTrash);

        //             foldersInTrash.forEach((element) => {
        //                 fs.rmdirSync(path.join(pathToTrash, element), {
        //                     recursive: true,
        //                 });
        //             });
        //         } catch (error) {
        //             console.error(error);
        //         }
        //     });
        // });
    });
});

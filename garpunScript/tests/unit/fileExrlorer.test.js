const fs = require('fs');
const path = require('path');
const fsp = require('fs').promises;

const expect = require('chai').expect;
const moment = require('moment');

require('dotenv').config();
const fileExplorer = require('./../../utils/fileExplorer/fileExplorer');

const today = moment().format('YYYYMMDD');
const dirNameToDelete = moment()
  .subtract(process.env.SAVE_TIME, 'days')
  .format('YYYYMMDD');
let folders = [];

describe('Test fileExplorer', function () {
  // it('Function setFileDirPath', () => {
  //   expect(fileExplorer.setFileDirPath('test_cam')).to.equal(
  //     path.join(process.env.TRASH_PATH, 'test_cam', today)
  //   );
  //   expect(fs.existsSync(process.env.TRASH_PATH, 'test_cam', today)).to.be.true;
  // });

  // before(function () {
  //   fs.rmdirSync(path.join(process.env.TRASH_PATH, 'test_cam', today), {
  //     recursive: true,
  //   });
  //   expect(
  //     fs.existsSync(path.join(process.env.TRASH_PATH, 'test_cam', today))
  //   ).to.be.false;
  // });

  // it('Function setFileDirPath dir not exist', () => {
  //   expect(fileExplorer.setFileDirPath('test_cam')).to.equal(
  //     path.join(process.env.TRASH_PATH, 'test_cam', today)
  //   );
  //   expect(fs.existsSync(process.env.TRASH_PATH, 'test_cam', today)).to.be.true;
  // });

  // before(function () {
  //   const folderPath = path.join(
  //     process.env.TRASH_PATH,
  //     'test_cam',
  //     dirNameToDelete
  //   );
  //   fs.mkdirSync(folderPath);
  //   expect(
  //     fs.existsSync(
  //       path.join(process.env.TRASH_PATH, 'test_cam', dirNameToDelete)
  //     )
  //   ).to.be.true;
  // });

  // it('Function setFileDirPath delete old dir', () => {
  //   expect(fileExplorer.setFileDirPath('test_cam')).to.equal(
  //     path.join(process.env.TRASH_PATH, 'test_cam', today)
  //   );
  //   expect(fs.existsSync(process.env.TRASH_PATH, 'test_cam', today)).to.be.true;
  //   expect(
  //     fs.existsSync(
  //       path.join(process.env.TRASH_PATH, 'test_cam', dirNameToDelete)
  //     )
  //   ).to.be.false;
  // });
  before(() => {
    process.env.ARCHIVE_DAYS = 5;
    let folders = [];
    const calcTestFolders = 5;
    for (let index = 0; index < calcTestFolders; index++) {
      const folderName = moment().subtract(index, 'days').format('YYYYMMDD');
      const folderPath = path.join(
        process.env['ARCHIVE_DIR'],
        'test_cam_ok',
        folderName
      );
      folders.push(folderPath);
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
    });
  });

  it('function oldFilesCleaner delete folders older 5 days', (done) => {
    fileExplorer.oldFilesCleaner('test_cam_ok', 'ARCHIVE_DIR').then((res) => {
      folders.forEach((folderPath) => {
        expect(fs.existsSync(folderPath)).to.be.true;
      });
      expect(res).to.equal('ARCHIVE_DIR test_cam_ok nothing to clean');
      done();
    });
  });
  it('function oldFilesCleaner delete folders older 1 days', (done) => {
    process.env.ARCHIVE_DAYS = 1;
    fileExplorer.oldFilesCleaner('test_cam_ok', 'ARCHIVE_DIR').then((res) => {
      const dirToClean = path.join(process.env['ARCHIVE_DIR'], 'test_cam_ok');
      const today = moment().format('YYYYMMDD');
      const folderShouldExist = path.join(
        process.env['ARCHIVE_DIR'],
        'test_cam_ok',
        today
      );
      fsp.readdir(dirToClean).then((files) => {
        expect(files.length).equal(1);
        expect(fs.existsSync(folderShouldExist)).to.be.true;
        expect(res).to.equal('ARCHIVE_DIR of test_cam_ok successful cleaned');
        done();
      });
    });
  });

  // it('function oldFilesCleaner test dir not exist', () => {
  //   fileExplorer.oldFilesCleaner('test_cam').then((res) => {
  //     expect(res.res).to.be.false;
  //     expect(res.msg).to.equal('test_cam nothing to clean');
  //   });
  // });
});

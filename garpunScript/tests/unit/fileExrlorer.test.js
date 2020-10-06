require('dotenv').config();
const fileExplorer = require('./../../utils/fileExplorer');
const expect = require('chai').expect;
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const today = moment().format('YYYYMMDD');
const dirNameToDelete = moment()
  .subtract(process.env.SAVE_TIME, 'days')
  .format('YYYYMMDD');

describe('Test fileExplorer', function () {
  it('Function setFileDirPath', () => {
    expect(fileExplorer.setFileDirPath('test_cam')).to.equal(
      path.join(process.env.TRASH_PATH, 'test_cam', today)
    );
    expect(fs.existsSync(process.env.TRASH_PATH, 'test_cam', today)).to.be.true;
  });

  before(function () {
    fs.rmdirSync(path.join(process.env.TRASH_PATH, 'test_cam', today), {
      recursive: true,
    });
    expect(
      fs.existsSync(path.join(process.env.TRASH_PATH, 'test_cam', today))
    ).to.be.false;
  });

  it('Function setFileDirPath dir not exist', () => {
    expect(fileExplorer.setFileDirPath('test_cam')).to.equal(
      path.join(process.env.TRASH_PATH, 'test_cam', today)
    );
    expect(fs.existsSync(process.env.TRASH_PATH, 'test_cam', today)).to.be.true;
  });

  before(function () {
    const folderPath = path.join(
      process.env.TRASH_PATH,
      'test_cam',
      dirNameToDelete
    );
    fs.mkdirSync(folderPath);
    expect(
      fs.existsSync(
        path.join(process.env.TRASH_PATH, 'test_cam', dirNameToDelete)
      )
    ).to.be.true;
  });

  it('Function setFileDirPath delete old dir', () => {
    expect(fileExplorer.setFileDirPath('test_cam')).to.equal(
      path.join(process.env.TRASH_PATH, 'test_cam', today)
    );
    expect(fs.existsSync(process.env.TRASH_PATH, 'test_cam', today)).to.be.true;
    expect(
      fs.existsSync(
        path.join(process.env.TRASH_PATH, 'test_cam', dirNameToDelete)
      )
    ).to.be.false;
  });

  // it('function oldFilesCleaner test dir exist', () => {
  //   fileExplorer.oldFilesCleaner('test_cam').then((res) => {
  //     expect(res.res).to.be.true;
  //     expect(res.msg).to.equal('test_cam 20200928 successful cleaned');
  //   });
  // });

  // it('function oldFilesCleaner test dir not exist', () => {
  //   fileExplorer.oldFilesCleaner('test_cam').then((res) => {
  //     expect(res.res).to.be.false;
  //     expect(res.msg).to.equal('test_cam nothing to clean');
  //   });
  // });
});

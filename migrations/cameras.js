//cmd:  set JSON=H:\cameras_camera.json&&node migrations/cameras
require('dotenv').config();
const dbConnect = require('../db/dbConnect');
const camerasList = require(process.env.JSON);

dbConnect
  .start()
  .then((res) => {
    const sqlQueries = camerasList.map((camera) => {
      return {
        uuid: camera.uuid,
        position: camera.position,
        name: camera.name,
        ftpUsername: camera.ftp_username,
        ftpPassword: camera.ftp_password,
        ftpHomeDir: camera.ftp_home_dir,
      };
    });
    return dbConnect.sequelize.models.cameras.bulkCreate(sqlQueries);
  })
  .catch((err) => {
    console.error(err);
  });

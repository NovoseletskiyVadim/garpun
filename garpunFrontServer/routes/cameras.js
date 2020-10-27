var express = require('express');
var router = express.Router();
const { models } = require('./../../garpunScript/db/dbConnect').sequelize;

router.get('/', function (req, res, next) {
  models.cameras
    .findAll({ where: { isOnLine: true }, raw: true })
    .then((result) => {
      res.send(result);
    });
});

module.exports = router;

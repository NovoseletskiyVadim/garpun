var express = require('express');
var router = express.Router();
const Cameras = require('./../db').models.cameras;
const accessCheck = require('./../middleWare/checkUserAccess');

router.get('/', accessCheck.onlyAuthenticated, (req, res, next) => {
  Cameras.findAll({ raw: true }).then((result) => {
    res.send(result);
  });
});

module.exports = router;

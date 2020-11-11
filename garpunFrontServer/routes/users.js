var express = require('express');
const passport = require('passport');
var router = express.Router();
const User = require('../models/users');
const accessCheck = require('./../middleWare/checkUserAccess');
/* GET users listing. */

router.get('/login', function (req, res, next) {
  res.render('login');
});

router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true,
  })
);

router.post('/create', accessCheck.onlyAdmin, (req, res, next) => {
  User.create({
    userLogin: req.body.username,
    userPassword: req.body.password,
  }).then((result) => {
    console.log(result);
    res.send('ok');
  });
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;

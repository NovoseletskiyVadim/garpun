const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/users');

module.exports = (app, db) => {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    console.log(user);
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    console.log('des', id);
    User.findOne({ where: { id } })
      .then((doc) => {
        done(null, doc);
        console.log(doc);
      })
      .catch((err) => {
        done(err, null);
      });
  });

  passport.use(
    new LocalStrategy((username, password, done) => {
      console.log(username, password);
      // // db.userList.findOne({ username: username }, function (err, user) {
      // return done(null, false);

      User.findOne({ where: { userLogin: username } })
        .then((user) => {
          if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
          }
          user.comparePassword(password).then((result) => {
            if (!result) {
              return done(null, false, { message: 'Incorrect password.' });
            } else {
              return done(null, user);
            }
          });
        })
        .catch((error) => {
          return done(error);
        });
    })
  );
};

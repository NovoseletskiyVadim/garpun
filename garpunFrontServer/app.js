var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('req-flash');
const bodyParser = require('body-parser');
const helmet = require('helmet');
var logger = require('morgan');
var favicon = require('serve-favicon');
var path = require('path');
const nocache = require('nocache');
const auth = require('./middleWare/passport');
const compression = require('compression');
require('dotenv').config();

var SequelizeStore = require('connect-session-sequelize')(session.Store);

const dbConnect = require('./db');
require('../garpunScript/models/cameras')(dbConnect);
// require('../garpunScript/models/users')(dbConnect);
require('./models/users');
dbConnect.sync({ alter: true });

var myStore = new SequelizeStore({
  db: dbConnect,
});

// const indexRouter = ;
// const usersRouter = require('./routes/users');
// const camerasRouter = require('./routes/cameras');

var app = express();

app.use(nocache());
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'object-src': ["'none'"],
        'connect-src': [
          "'self'",
          '10.15.1.235:*',
          'ws://10.15.1.235:8888',
          'ws://localhost:8888',
          'localhost:*',
        ],
      },
    },
  })
);

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(bodyParser.json());
app.use(
  session({
    secret: 'keyboard cat',
    store: myStore,
    saveUninitialized: true,
    resave: false, // we support the touch method so per the express-session docs this should be set to false
  })
);
// app.use(bodyParser.urlencoded({ extended: true }));

myStore.sync();

app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
auth(app, dbConnect);
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/cameras', require('./routes/cameras'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  console.log(err);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

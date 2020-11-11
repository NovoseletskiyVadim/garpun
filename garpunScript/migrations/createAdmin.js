require('dotenv').config({ path: '../.env' });
const readline = require('readline');
const bcrypt = require('bcrypt');
const dbConnect = require('./../db/dbConnect');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function adminLoginName() {
  return new Promise((resolve) => {
    rl.question('Set login name (min: 3 letters): ', (name) => {
      resolve(name);
    });
  });
}

function userPassword() {
  return new Promise((resolve, reject) => {
    rl.question('Set user password (min: 6 characters): ', (pass) => {
      bcrypt.genSalt(process.env.SALT_WORK_FACTOR, (err, salt) => {
        if (err) reject(err);
        bcrypt.hash(pass, salt, (err, hashPass) => {
          if (err) reject(err);
          resolve(hashPass);
        });
      });
    });
  });
}

dbConnect
  .dbCreate()
  .then(() => {
    console.log('tables created');
    return;
  })
  .then(() => {
    return dbConnect.start().then(() => {
      return adminLoginName().then((login) => {
        return userPassword().then((userPass) => {
          return dbConnect.sequelize.models.userList
            .create({
              userLogin: login,
              userPassword: userPass,
              userRole: 'ADMIN',
            })
            .then((res) => {
              console.log('New user was created');
              dbConnect.sequelize.close();
              process.exit(0);
            });
        });
      });
    });
  })
  .catch(console.error);

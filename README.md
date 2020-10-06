# The garpun

This is a app for adapting hikvision cameras to prepare and sending data to the API.

## Config

```
node v12.13.1
npm v6.14.6
pm2 4.5.0

-for linux host machine
apt install vsftpd
apt install db-util
apt install sqlite3

```

## Instalation

```
1 $ npm install
2 Create .env file
  MEDIA_PATH= path to FTP dir
  TRESH_PATH= path where will be stored files with wrong data type and file name
  API_SERVER=
  API_KEY=
  SQL_DB=
  PROVIDER=
  TIME_TO_CHECK_CAMERAS=
  ARCHIVE_DAYS=
  ARCHIVE_PATH=
  BOT_TOKEN=
 - add for run tests:
  TEST_SOURCE_FILE=
  TEST_LOAD_CAMS=
for linux host machine
  copy /migrations/vsftpd.conf to /etc/vsftpd.conf - config for FTP
  $ sudo bash /migrations/addFTPuser.sh   - create FTP user
  $ sudo service vsftpd restart
```

##Start

```
$ npm start
or
$ npm run dev
or
$ pm2 start ecosystem.config.js  - like a daemon process
```

##Create daemon process

```
    If process is not started yet:
      for production
        $pm2 start ecosystem.config.js --env production
      for dev
        $pm2 start ecosystem.config.js
    # Generate Startup Script
      $ pm2 startup
    # Freeze your process list across server restart
      $ pm2 save

    # Remove Startup Script
      $ pm2 unstartup
```

##Monitoring

```
$ pm2 monit
$ pm2 logs garpun
$ pm2 stop garpun
$ pm2 restart garpun
$ pm2 delete garpun
```

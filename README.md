# The garpun

This is a app for adapting hikvision cameras to prepare and sending data to the API.

## Config

```
node v12.13.1
npm v6.14.6
pm2 4.5.0

-for linux host machine
sudo apt install -y vsftpd
sudo apt install -y db-util
sudo apt install -y sqlite3
sudo apt install -y curl
sudo apt install -y git
git clone https://github.com/NovoseletskiyVadim/garpun.git
curl -sL https://deb.nodesource.com/setup_12.x | bash -
sudo apt-get install -y nodejs
```

## Instalation

```
1 npm install
2 Create .env file
  MEDIA_PATH=
  TRASH_DIR=
  API_SERVER=
  API_KEY=
  PROVIDER=
  SQL_DB=
  TIME_TO_CHECK_CAMERAS=
  ARCHIVE_DAYS=
  MAX_FILE_SIZE=
  ARCHIVE_DIR=
  BOT_TOKEN=
  SOCKET_PORT=
  SALT_WORK_FACTOR =
 - add for run tests:
  TEST_SOURCE_FILE=
  TEST_LOAD_CAMS=
for linux host machine
  copy /migrations/setFtp/vsftpd.conf to /etc/ - config for FTP
  copy /migrations/setFtp/vsftpd.virtual to /etc/pam.d/ - config for PAM
  usermod -aG ftp user  - add user to ftp group

  $ sudo bash /migrations/addFTPuser.sh   - create user for FTP
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
sudo npm install pm2 -g
pm2 startup

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

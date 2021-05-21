#!/bin/bash
# ADD new camera to db
GARPUN_DB="/home/garpun/appGarpun4/garpun/garpunScript/db/main.db"
echo Camera uuid:
read uuid
echo Camera ftpHomeDir:
read ftpHomeDir
echo Camera ftpPassword:
read ftpPassword
echo Camera name:
read name
echo Camera  position e.g.  48.753056,30.254222 :
read  position
echo -e  "Camera data:\n
        uuid: $uuid\n
        ftpHomeDir: $ftpHomeDir\n
        ftpPassword: $ftpPassword\n
        name: $name\n
        position: $position\n
Is all data correct: [y\n]?"
read answer
if [ $answer=="y" ];
then
#add user to db
sqlite3 -batch $GARPUN_DB "INSERT INTO cameras(uuid, ftpHomeDir, name, position, ftpPassword, createdAt, updatedAt) VALUES( '$uuid','$ftpHomeDir','$name','$position','$ftpPassword',datetime('now','localtime'),datetime('now','localtime'));"
echo $ftpHomeDir >> logins.txt
echo $ftpPassword >> logins.txt
#add user to virtual user list
db_load -n -T -t hash -f logins.txt /etc/vsftpd-virtual-user.db
rm logins.txt

#create ftp user dir
mkdir /home/ftp/$ftpHomeDir
chown ftp:ftp /home/ftp/$ftpHomeDir
chmod 775 /home/ftp/$ftpHomeDir
echo OK
else
exit 0
fi

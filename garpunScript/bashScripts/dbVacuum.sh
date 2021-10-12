#!/bin/sh
result=`sqlite3  /home/garpun/HarpoonData/temp.db  "SELECT Count(*) FROM pendingLists"`
if (($result == 0));
then
sqlite3  /home/garpun/HarpoonData/temp.db "vacuum"
echo 'TempDB successfully vacuumed'
fi
#sqlite3 /home/garpun/appGarpun4/garpun/garpunScript/db/main.db "vacuum"
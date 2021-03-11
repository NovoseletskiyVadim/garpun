#!/bin/sh
sqlite3  /home/garpun/appGarpun4/garpun/garpunScript/db/temp.db  "vacuum"
sqlite3 /home/garpun/appGarpun4/garpun/garpunScript/db/main.db "vacuum"

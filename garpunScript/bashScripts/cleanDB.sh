#!/bin/sh

sqlite3 /home/garpun/appGarpun4/garpun/garpunScript/db/main.db "DELETE FROM camEvents WHERE createdAt  <= date('now','-1 month');"

#!/bin/sh

sqlite3 /home/garpun/HarpoonData/main.db "DELETE FROM camEvents WHERE createdAt  <= date('now','-1 month');"

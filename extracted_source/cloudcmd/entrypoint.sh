#!/bin/bash

pm2 start pm2.json

nginx -g 'daemon off;'
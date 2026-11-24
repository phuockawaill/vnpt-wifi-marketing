#!/bin/sh

dir="`pwd`"

if [ ! -s "~/.ssh/id_rsa.pub" ] ; then
  echo "Generating ssh key..."
  ssh-keygen -t rsa -C $USER
fi

echo "Please add your public key to git repo before continue"
cat ~/.ssh/id_rsa.pub

echo
echo "Enter to continue after finished"
read

source config.sh

sudo -E sh -c "apt install libkrb5-dev"

# 1. clone ads-platform
git clone git@gitlab.com:wifi4u/wifi4u-ads.git ads
cd ads
npm install

cp "$dir"/code/ads/*.production.json server
sed -i s/_ADS_PORT_/"$adsPort"/g server/config.production.json
sed -i s/_PUBLIC_IP_/"$publicIp"/g server/config.production.json

sed -i s/_REDIS_PORT_/"$redisPort"/g server/datasources.production.json
sed -i s/_REDIS_PASSWORD_/"$redisPass"/g server/datasources.production.json

sed -i s/_MONGO_PORT/"$mongoPort"/g server/datasources.production.json
sed -i s/_MONGO_PASSWORD_/"$mongoClient"/g server/datasources.production.json

sed -i s/_ES_PORT/"$esPort"/g server/datasources.production.json
sed -i s/_ES_PASSWORD_/"$esPassword"/g server/datasources.production.json

NODE_ENV=production npm run build

cp "$dir"/code/ads/pm2.json .




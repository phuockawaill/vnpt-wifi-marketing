#!/bin/sh

dir="`pwd`"

# 0. Turning
chmod +x "$dir"/turning/*
sudo -E sh -c "cp -rf \"$dir/turning/rc.local\" /etc"
sudo -E sh -c "cp -rf \"$dir/turning/sysctl.conf\" /etc"
sudo -E sh -c "cp -rf \"$dir/turning/limits.conf\" /etc/security"
sudo -E sh -c "sysctl -p"

# 1. Docker [https://get.docker.com/]
curl -fsSL get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Docker compose
sudo -i
curl -L https://github.com/docker/compose/releases/download/1.15.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
exit

# 3. nvm + nodejs + pm2
curl -o- "https://raw.githubusercontent.com/creationix/nvm/v0.33.4/install.sh" | bash
source ~/.bashrc
nvm install 4
npm i -g npm@3
npm i -g pm2
pm2 install pm2-logrotate

# 4. Tạo thư mục chứa source
sudo -E sh -c "mkdir -p /data"
sudo -E sh -c "chown $USER:$USER /data"

cd /data
mkdir wifi4u
cd wifi4u
mkdir -p data/es
mkdir -p data/mongo
mkdir -p data/redis
mkdir -p data/mysql
mkdir -p config

cp -rf "$dir/config/*" config
cp -rf "$dir/config.sh" .
cp -rf "$dir/docker-compose*" .
source ./config.sh

sed -i s/_REDIS_PORT_/"$redisPort"/g docker-compose.yml
sed -i s/_REDIS_PASS_/"$redisPass"/g config/redis/redis.conf

sed -i s/_MONGO_PORT_/"$mongoPort"/g docker-compose.yml

sed -i s/_ES_PORT_/"$esPort"/g docker-compose.yml
sed -i s/_KIBANA_PORT_/"$kibanaPort"/g docker-compose.yml
sed -i s/_KIBANA_PASSWORD_/"$kibanaPass"/g docker-compose.yml

sed -i s/_MYSQL_ROOT_PASSWORD_/"$mysqlRoot"/g docker-compose.yml
sed -i s/_MYSQL_PASSWORD_/"$mysqlClient"/g docker-compose.yml
sed -i s/_MYSQL_PASSWORD_/"$mysqlClient"/g docker-compose.yml
sed -i s/_MYSQL_PORT_/"$mysqlPort"/g docker-compose.yml
sed -i s/_MYSQL_PORT_/"$mysqlPort"/g config/mysql/my.cnf

# 5. Setup mongo
docker-compose -f docker-compose-mongo-no-auth.yml up -d mongo
while [ -z "$mongoRoot" ] ; do
  echo -n "Enter mongo root password: "
  read mongoRoot
done

docker exec -it wifi4u_mongo_1 mongo admin --eval 'db.system.users.remove({});'
docker exec -it wifi4u_mongo_1 mongo admin --eval 'db.system.version.remove({});'
docker exec -it wifi4u_mongo_1 mongo admin --eval 'db.system.version.insert({ "_id" : "authSchema", "currentVersion" : 3 });'
docker exec -it wifi4u_mongo_1 mongo admin --eval "db.createUser({ user: 'root', pwd: '$mongoRoot', roles: [ { role: 'root', db: 'admin' } ] });"

docker-compose -f docker-compose-mongo-no-auth.yml stop mongo
docker-compose up -d mongo

while [ -z "$mongoClient" ] ; do
  echo -n "Enter mongo client password: "
  read mongoClient
done

docker exec -it wifi4u_mongo_1 mongo admin \
  --eval "db.auth('root', '$mongoRoot') && db.getSiblingDB('db').createUser({ user: 'client', pwd: '$mongoClient', roles: [ { role: 'readWrite', db: 'db' }, { role: 'dbAdmin', db: 'db' } ] })"

# 6. Setup mysql
cp -rf "$dir/db.sql" .

docker-compose up -d mysql
sudo -E sh -c "cp db.sql data/mysql"
sleep 10
docker exec -it wifi4u_mysql_1 bash -c "mysql -u root --password='$mysqlRoot' db < /var/lib/mysql/db.sql"

# 7. Setup elastic
docker-compose up -d elastic

curl -XPUT -u elastic:changeme '127.0.0.1:59200/_xpack/security/user/elastic/_password' -d "{
  \"password\" : \"$esPassword\"
}"

curl -XPUT -u elastic:"$esPassword" '127.0.0.1:59200/_xpack/security/user/kibana/_password' -d "{
  \"password\" : \"$kibanaPassword\"
}"

export ES_HOST="127.0.0.1:${esPort}"
export ES_USER="-u elastic:${esPassword}"

sh "$dir"/init-es.sh

# 8. Start other services
docker-compose up -d redis kibana phpmyadmin

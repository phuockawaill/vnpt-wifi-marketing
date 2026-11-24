FROM node:4.7.3

RUN apt-get update
RUN apt-get install -y nginx
RUN mkdir -p /source
WORKDIR /source

COPY nginx/default /etc/nginx/sites-available/
COPY nginx/nginx.conf /etc/nginx/

RUN npm install -g npm@3 pm2

COPY package.json  /source/
RUN npm install

COPY . /source/

EXPOSE 80

CMD ./entrypoint.sh

FROM alpine:latest

RUN apk update && apk add g++ make nodejs python ruby

COPY . /var/www/pev

WORKDIR /var/www/pev

RUN npm install --unsafe-perm

CMD npm start

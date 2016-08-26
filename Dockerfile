FROM debian:jessie

RUN apt-get update && apt-get -y install apt-transport-https curl g++ make python ruby

RUN curl -sL https://deb.nodesource.com/setup_4.x | bash -

RUN apt-get -y install nodejs

COPY tsdrc ~/.tsdrc

COPY . /var/www/pev

WORKDIR /var/www/pev

RUN npm install -g gulp

RUN npm install

CMD cd /var/www/pev && npm start

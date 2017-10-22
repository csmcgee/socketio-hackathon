FROM node:latest

RUN mkdir /src

RUN npm install gulp -g

WORKDIR /src
ADD app/package.json /src/package.json
RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
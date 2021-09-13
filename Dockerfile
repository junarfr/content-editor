FROM node:lts-alpine

RUN mkdir /app
WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm audit fix

COPY . .
CMD [ "npm", "run", "dev" ]

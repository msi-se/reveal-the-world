FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3002
ENTRYPOINT ["npm", "start"]

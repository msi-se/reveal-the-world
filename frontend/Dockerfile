FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm install serve

EXPOSE 3000

ENTRYPOINT [ "./entrypoint.sh" ]

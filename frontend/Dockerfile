FROM node:18-alpine

# ARG VITE_TENANT
# ARG VITE_TENANT_CLIENT_ID

# ENV VITE_TENANT=$VITE_TENANT
# ENV VITE_TENANT_CLIENT_ID=$VITE_TENANT_CLIENT_ID

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm install serve

# RUN npm run build

EXPOSE 3000
# ENTRYPOINT [ "npx", "serve", "-s" ,"dist" ]

ENTRYPOINT [ "./entrypoint.sh" ]

FROM node:26-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl bash
RUN npm install -g @nestjs/cli
COPY . /app
RUN npm i
RUN npx prisma generate
RUN npx prisma generate --sql
RUN npx prisma migrate deploy
RUN npm run build

FROM node:26-alpine AS final
WORKDIR /app
COPY --from=build app/dist ./app
RUN node dist/main.js
EXPOSE 3000

FROM node:26-alpine AS build
WORKDIR /app
RUN npm install -g @angular/cli
COPY . /app
RUN npm ci
RUN npm run build

FROM nginx:stable AS final
EXPOSE 80
COPY --from=build app/dist/rl/browser  /usr/share/nginx/html
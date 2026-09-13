FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev eudev-dev libusb-dev openssl
COPY . .
RUN npm install
RUN npx prisma generate
RUN npm run build
CMD ["node", "dist/main.js"]
EXPOSE 3000
EXPOSE 3001

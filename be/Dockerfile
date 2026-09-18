FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev eudev-dev libusb-dev openssl
COPY . .
RUN npm install
# prisma.config.ts requires DATABASE_URL to be resolvable; generate only
# needs the schema, not a reachable database, so a placeholder is enough
# here. The real value is provided via docker-compose at runtime.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN npx prisma generate
RUN npm run start:dev
CMD ["node", "dist/main.js"]
EXPOSE 3000
EXPOSE 3001
EXPOSE 3002

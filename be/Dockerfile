FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npx prisma generate
RUN npm run build
CMD ["node", "dist/main.js"]
EXPOSE 3000:3000

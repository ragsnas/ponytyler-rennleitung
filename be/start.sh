#!bin/bash

echo "backend start script"
echo "current path"
pwd

echo "current folder"
ls -la

echo "data folder"
ls -la data

echo "now starting npm install"
npm i

echo "generate prisma"
npx prisma generate

echo "generate prisma sql"
npx prisma generate --sql

echo "prisma migrate"
npx prisma migrate deploy

echo "---------------------"
echo "starting backend"
npm run start:dev

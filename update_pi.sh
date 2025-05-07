echo "----- STARTING PONY TYLER RENNLEITUNG UPDATE --------"
cd ~/ponytyler-rennleitung
echo "-- BACKUP DATABASE ----------------------------------"
sudo cp ~/ponytyler-rennleitung/be/prisma/*.db ~/rl.db
sudo cp ~/ponytyler-rennleitung/be/prisma/*.db ~/rl_db_backup_$EPOCHSECONDS.db
echo "-- PULL FROM REPOSITORY -----------------------------"
git reset --hard
git pull
echo "-- COPY UI TO NGINX HTML FOLDER ---------------------"
sudo cp ~/ponytyler-rennleitung/ui/rl/dist/rl/*.* /var/www/html/
sudo chmod a+r /var/www/html/*.*
echo "-- OVERWRITE NGINX CONFIG ---------------------------"
sudo cp ~/ponytyler-rennleitung/ui/rl/nginx_config /etc/nginx/sites-enabled/default
echo "-- RESTORE DATABASE BACKUP --------------------------"
sudo cp ~/rl.db ~/ponytyler-rennleitung/be/prisma/rl.db
echo "-- RESTART NGINX ------------------------------------"
sudo systemctl start nginx
sudo systemctl restart nginx
echo "-- BUILD BACKEND ------------------------------------"
cd ~/ponytyler-rennleitung/be
npm i
npx prisma generate
npx prisma generate --sql
npx prisma migrate deploy
npm run build
echo "-- RESTART BACKEND SERVICE --------------------------"
pm2 restart all
echo "----- PONY TYLER RENNLEITUNG UPDATE FINISHED --------"

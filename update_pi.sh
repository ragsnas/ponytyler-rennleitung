echo "\n\n----- STARTING PONY TYLER RENNLEITUNG UPDATE --------\n"
cd ~/ponytyler-rennleitung
echo "\n-- BACKUP DATABASE ----------------------------------\n"
sudo cp ~/ponytyler-rennleitung/be/prisma/*.db ~/rl.db
sudo cp ~/ponytyler-rennleitung/be/prisma/*.db ~/rl_db_backup_$EPOCHSECONDS.db
echo "\n-- PULL FROM REPOSITORY -----------------------------\n"
git reset --hard
git pull
echo "\n-- COPY UI TO NGINX HTML FOLDER ---------------------\n"
sudo cp ~/ponytyler-rennleitung/ui/rl/dist/rl/browser/*.* /var/www/html/
sudo chmod a+r /var/www/html/*.*
echo "\n-- OVERWRITE NGINX CONFIG ---------------------------\n"
sudo cp ~/ponytyler-rennleitung/ui/rl/nginx_config /etc/nginx/sites-enabled/default
echo "\n-- RESTORE DATABASE BACKUP --------------------------\n"
sudo cp ~/rl.db ~/ponytyler-rennleitung/be/prisma/rl.db
echo "\n-- RESTART NGINX ------------------------------------\n"
sudo systemctl start nginx
sudo systemctl restart nginx
echo "\n-- BUILD BACKEND ------------------------------------\n"
cd ~/ponytyler-rennleitung/be
npm i
npx prisma generate
npx prisma generate --sql
npx prisma migrate deploy
npm run build
echo "\n-- RESTART BACKEND SERVICE --------------------------\n"
pm2 restart all
echo "\n----- PONY TYLER RENNLEITUNG UPDATE FINISHED --------\n\n"

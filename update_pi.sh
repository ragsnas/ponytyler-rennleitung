printf "\n\n----- STARTING PONY TYLER RENNLEITUNG UPDATE ------\n"
cd ~/ponytyler-rennleitung
printf "\n- BACKUP DATABASE ---------------------------------\n"
sudo cp --verbose ~/ponytyler-rennleitung/be/prisma/*.db ~/rl.db
sudo cp --verbose ~/ponytyler-rennleitung/be/prisma/*.db ~/rl_db_backup_$EPOCHSECONDS.db
printf "\n- PULL FROM REPOSITORY ----------------------------\n"
git reset --hard
git pull
printf "\n- COPY UI TO NGINX HTML FOLDER --------------------\n"
sudo cp --verbose ~/ponytyler-rennleitung/ui/rl/dist/rl/browser/*.* /var/www/html/
sudo chmod -v a+r /var/www/html/*.*
printf "\n- OVERWRITE NGINX CONFIG --------------------------\n"
sudo cp --verbose ~/ponytyler-rennleitung/ui/rl/nginx_config /etc/nginx/sites-enabled/default
printf "\n- RESTORE DATABASE BACKUP -------------------------\n"
sudo cp --verbose ~/rl.db ~/ponytyler-rennleitung/be/prisma/rl.db
printf "\n- RESTART NGINX -----------------------------------\n"
sudo systemctl start nginx
sudo systemctl restart nginx
printf "\n- BUILD BACKEND -----------------------------------\n"
cd ~/ponytyler-rennleitung/be
npm i
printf "\n- BUILD/MIGRATE DATABASE --------------------------\n"
npx prisma generate
npx prisma generate --sql
npx prisma migrate deploy
printf "\n- BUILD ACTUAL BACKEND ----------------------------\n"
npm run build
printf "\n- RESTART BACKEND SERVICE --------------------------\n"
pm2 restart all
printf "\n----- PONY TYLER RENNLEITUNG UPDATE FINISHED -------\n\n"

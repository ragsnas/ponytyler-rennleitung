cd ~/ponytyler-rennleitung
git pull
sudo cp ponytyler-rennleitung/ui/rl/dist/rl/*.* /var/www/html/
sudo chmod a+r /var/www/html/*.*
sudo cp ponytyler-rennleitung/ui/rl/nginx_config /etc/nginx/sites-enabled/default
sudo systemctl start nginx
sudo systemctl restart nginx
cd ~/ponytyler-rennleitung/be
npm i
pm2 restart all

echo "#### Now attempting to Setup Raspberry pi for Rennleitung ####"
cd ~
sudo apt update
sudo apt upgrade
sudo apt remove apache2
sudo apt --assume-yes install vim curl git nginx
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
cd ~
git clone https://github.com/ragsnas/ponytyler-rennleitung.git
sudo cp ponytyler-rennleitung/ui/rl/dist/rl/*.* /var/www/html/
sudo chmod a+r /var/www/html/*.*
sudo cp ponytyler-rennleitung/ui/rl/nginx_config /etc/nginx/sites-enabled/default
sudo systemctl start nginx
sudo systemctl restart nginx
npm install pm2 -g
pm2 startup
sudo env PATH=$PATH:/home/ponytyler/.nvm/versions/node/v22.13.1/bin /home/ponytyler/.nvm/versions/node/v22.13.1/lib/node_modules/pm2/bin/pm2 startup systemd -u ponytyler --hp /home/ponytyler
cd ~/ponytyler-rennleitung/be
npm i
pm2 start /home/ponytyler/ponytyler-rennleitung/be/dist/main.js
pm2 save

echo "\n\nAll setup. Remember to copy the current rl.db to \n~/ponytyler-rennleitung/be/prisma/rl.db and then restart the pi again.\n\n"
echo "scp rl.db ponytyler@ponytyler.local:~/ponytyler-rennleitung/be/prisma/rl.db"
sudo shutdown -r now

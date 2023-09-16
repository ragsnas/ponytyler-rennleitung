# Pony Tyler Rennleitung

This is a Software for organising Goldsprint & Massenkaraoke Events.
The first version simply provides a webapp for the so called "Rennleitung" and the "DJ" to communicate the Races.


## How to Start

To start, we recommend using swa cli tool locally
https://github.com/Azure/static-web-apps-cli

First, start the Frontend in `ui/rl` like this:

```npm run start```

Then, start the Backend in `be` like this:

```npm run start```

Then start swa to combine the two

```swa start http://localhost:4200 --api-location http://localhost:3000 --port 4280```

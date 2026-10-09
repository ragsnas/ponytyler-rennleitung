import mqtt from 'mqtt';

enum RaceState {
BEFORE_SHOW = 'BEFORE_SHOW',
BEFORE_RACE = 'BEFORE_RACE',
RACE = 'RACE',
RACE_FINISHED = 'RACE_FINISHED',
PLAYING_VIDEO = 'PLAYING_VIDEO',
VIDEO_FINISHED = 'VIDEO_FINISHED',
SHOW_FINISHED = 'SHOW_FINISHED', 
BEFORE_ENCORE = 'BEFORE_ENCORE',
PLAYING_ENCORE = 'PLAYING_ENCORE',
ENCORE_FINISHED = 'ENCORE_FINISHED'
}

let currentRaceState: RaceState = RaceState.BEFORE_SHOW;

// Connect to your local Bun broker
const client = mqtt.connect('mqtt://localhost:3001');
const INTERVAL = 5; // 5 milliseconds
const MAX_BIKE_ADVANCE = 120; // 5 milliseconds
const bikeAdvanceTopic1 = 'sensors/bike-1';
const bikeAdvanceTopic2 = 'sensors/bike-2';
const stateChangeTopic = 'state/change-consumer';


client.on('connect', () => {
  console.log('✅ Connected to broker');

  let bikeAdvance1 = 0;
  let bikeAdvance2 = 0;

  function sendMessage(topic: string, value: string) {
    client.publish(
        topic,
        value,
        { qos: 1 },
        (err) => {
            if (err) {
                console.error('❌ Failed to publish:', err);
            } else {
                console.log(`🚀 Message sent to ${topic}:`, value);
            }
        }
    );
  }

  client.subscribe(stateChangeTopic, (err) => {
    if (!err) {
      console.log(`📥 Subscribed to ${stateChangeTopic}`);
    } else {
      console.error('Subscription error:', err);
    }
  });

  client.on("message", (p1, payload) => {
    console.info('Received message:', p1, payload?.toString());
    const messageObject = JSON.parse(payload?.toString() || '{}');
    if(messageObject && messageObject.topic) {
        console.info('Message is for topic:', messageObject.topic);
    } else {
      console.info('Could not convert Message:', payload);
    }
  });

//  interval._onTimeout = () => {
 //   client.end();
 // }

});

client.on('error', (err) => {
  console.error('Connection error:', err);
});

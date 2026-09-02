import mqtt from "mqtt";

export enum RaceState {
  WAITING_FOR_OPPONENT = "WAITING_FOR_OPPONENT",
  WAITING_TO_RACE = "WAITING_TO_RACE",
  CANCELED = "CANCELED",
  RACED = "RACED",
}

// Connect to your local Bun broker
const client = mqtt.connect('mqtt://localhost:3001', {
  clientId: 'fake-producer'
});
const INTERVAL = 2; // milliseconds
const MAX_BIKE_ADVANCE = 120; // 5 milliseconds
const bikeAdvanceTopic1 = 'sensors/bike-1';
const bikeAdvanceTopic2 = 'sensors/bike-2';
const stateChangeTopic = 'state/change-unused-producer';

client.on('connect', () => {
  console.log('✅ Connected to broker');

  let bikeAdvance1 = 0;
  let bikeAdvance2 = 0;

  /*
  client.subscribe(stateChangeTopic, (err) => {
    if (!err) {
      console.log(`📥 Subscribed to ${stateChangeTopic}`);
    } else {
      console.error('Subscription error:', err);
    }
  });
  */

  /*
  client.on("message", (topic, payload) => {
    console.info(`Received message [${topic}]:`, payload?.toString());
    const messageObject = JSON.parse(payload?.toString() || '{}');
    if(messageObject && messageObject.newState) {
        currentRaceState = messageObject.newState;
        console.info('Updated current race state to:', currentRaceState);
    } else {
      console.info('Could not convert Message:', payload);
    }
  });
  */


  let sequenzCounter = 0;
  let pulseCounter1 = 0;
  let pulseCounter2 = 0;
  let timestamp = 0;

  const interval = setInterval(() => {
    
    if (true) {
      timestamp++;
      sequenzCounter++;
      if(Math.random() > 0.33) {
        pulseCounter1 += Math.round(Math.random()*1.2);
        sendBikeMessage('1', sequenzCounter, pulseCounter1, timestamp);
      }
      if(Math.random() > 0.33) {
        timestamp++;
        pulseCounter2 += Math.round(Math.random()*1.2);
        sendBikeMessage('2', sequenzCounter, pulseCounter2, timestamp);
      }
    }
  }, INTERVAL);

setTimeout(() => {
  interval.close();
  client.end();
}, INTERVAL * 500)

//  interval._onTimeout = () => {
 //   client.end();
 // }

});

function handleStateChange(
  currentRaceState: RaceState,
  bikeAdvance1: number,
  bikeAdvance2: number) {
  if (currentRaceState ===  RaceState.BEFORE_SHOW) {
        if(Math.random() < 0.01) {
          sendMessage(
            stateChangeTopic,
            JSON.stringify({ newState: RaceState.BEFORE_RACE }));
        }
    } else if(currentRaceState ===  RaceState.BEFORE_RACE) {
        if(Math.random() < 0.01) {
        sendMessage(
          stateChangeTopic,
          JSON.stringify({ newState: RaceState.RACE }));
        }
    } else if(currentRaceState ===  RaceState.RACE) {
      if (bikeAdvance1 <= MAX_BIKE_ADVANCE && Math.random() < 0.75) {
        bikeAdvance1++;
        console.log(`Advancing Bike to ${bikeAdvance1}`);
        sendMessage(
          bikeAdvanceTopic1,
          bikeAdvance1.toString());
      }
      if (bikeAdvance2 <= MAX_BIKE_ADVANCE && Math.random() < 0.75) {
        bikeAdvance2++;
        console.log(`Advancing Bike to ${bikeAdvance2}`);
        sendMessage(
          bikeAdvanceTopic2,
          bikeAdvance2.toString());
      }
      if (bikeAdvance1 >= MAX_BIKE_ADVANCE) {
        sendMessage(
          stateChangeTopic,
          JSON.stringify({ newState: RaceState.RACE_FINISHED, bikeWon: 1 }));
      } else if (bikeAdvance2 >= MAX_BIKE_ADVANCE) {
        sendMessage(
          stateChangeTopic,
          JSON.stringify({ newState: RaceState.RACE_FINISHED, bikeWon: 2 }));
      }
    } else if (currentRaceState ===  RaceState.RACE_FINISHED) {
        if(Math.random() < 0.001) {
        sendMessage(
          stateChangeTopic,
          JSON.stringify({ newState: RaceState.RACE }));
        }
    } else if (currentRaceState ===  RaceState.PLAYING_VIDEO) {
      if(Math.random() < 0.01) {
        sendMessage(
          stateChangeTopic,
          JSON.stringify({ newState: RaceState.VIDEO_FINISHED }));
      }
    } else if (currentRaceState ===  RaceState.VIDEO_FINISHED) {
      if(Math.random() < 0.1) {
        sendMessage(
          stateChangeTopic,
          JSON.stringify({ newState: RaceState.BEFORE_RACE }));
      }
    }
}

  function sendBikeMessage(bikeId: '1' | '2', sequenzCounter: number, pulseCounter: number, timestamp: number) {
          sendMessage(
            `Bike/${bikeId}`,
            JSON.stringify({
              "sequenz":sequenzCounter++,
              "pulsecount": pulseCounter,
              "timestamp": timestamp
             }));
        }

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

client.on('error', (err) => {
  console.error('Connection error:', err);
});

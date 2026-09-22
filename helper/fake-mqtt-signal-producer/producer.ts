import mqtt from "mqtt";

// Connect to your local Bun broker
const client = mqtt.connect("mqtt://localhost:3001", {
  clientId: "fake-producer",
});
const INTERVAL = 2; // milliseconds
const MAX_BIKE_ADVANCE = 120; // 5 milliseconds
const bikeAdvanceTopic1 = "Bike/1";
const bikeAdvanceTopic2 = "Bike/2";
const bikeWonTopic1 = "Bike/1/won";
const bikeWonTopic2 = "Bike/2/won";
const bikeResetTopic1 = "Bike/1/cmd";
const bikeResetTopic2 = "Bike/2/cmd";
const stateChangeTopic = "Bike/change-unused-producer";

client.on("connect", () => {
  console.log("✅ Connected to broker");

  let sequenzCounter = 0;
  let pulseCounter1 = 0;
  let pulseCounter2 = 0;
  let timestamp = 0;
  let fakeRaceInterval: ReturnType<typeof setTimeout> | undefined = undefined;


  client.on("message", (p1, payload) => {
    console.info('Received message:', p1, payload?.toString());
    const messageObject = JSON.parse(payload?.toString() || '{}');
    if(messageObject && messageObject.topic) {
      console.info('Message is for topic:', messageObject.topic);
      if(messageObject.topic === bikeResetTopic1 || messageObject.topic === bikeResetTopic2) {
        // Start Fake Race
        fakeRaceInterval = fakeRace();
      } else if(messageObject.topic === bikeWonTopic1 || messageObject.topic === bikeWonTopic2) {
        // Start Fake Race
        clearInterval(fakeRaceInterval);
      }
    } else {
      console.info('Could not convert Message:', payload);
    }
  });

  const fakeRace = () => {
    if(!fakeRaceInterval) {
      return setInterval(() => {
        if (true) {
          timestamp++;
          sequenzCounter++;
          if (Math.random() > 0.33) {
            pulseCounter1 += Math.round(Math.random() * 1.2);
            sendBikeMessage("1", sequenzCounter, pulseCounter1, timestamp);
          }
          if (Math.random() > 0.33) {
            timestamp++;
            pulseCounter2 += Math.round(Math.random() * 1.2);
            sendBikeMessage("2", sequenzCounter, pulseCounter2, timestamp);
          }
        }
      }, INTERVAL);
    }
  }


  // setTimeout(() => {
  //   interval.close();
  //   client.end();
  // }, INTERVAL * 500);

//  interval._onTimeout = () => {
  //   client.end();
  // }

});

function sendBikeMessage(bikeId: "1" | "2", sequenzCounter: number, pulseCounter: number, timestamp: number) {
  sendMessage(
    `Bike/${bikeId}`,
    JSON.stringify({
      "sequenz": sequenzCounter++,
      "pulsecount": pulseCounter,
      "timestamp": timestamp,
    }));
}

function sendMessage(topic: string, value: string) {
  client.publish(
    topic,
    value,
    { qos: 1 },
    (err) => {
      if (err) {
        console.error("❌ Failed to publish:", err);
      } else {
        console.log(`🚀 Message sent to ${topic}:`, value);
      }
    },
  );
}

client.on("error", (err) => {
  console.error("Connection error:", err);
});

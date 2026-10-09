import mqtt from "mqtt";

// Connect to your local Bun broker
const client = mqtt.connect("mqtt://localhost:3001", {
  clientId: "fake-producer",
});
const INTERVAL = 10; // milliseconds
const MAX_BIKE_ADVANCE = 120;
const bikeWonTopic1 = "Bike/1/won";
const bikeWonTopic2 = "Bike/2/won";
const bikeWonTopic3 = "Bike/3/won";
const bikeResetTopic1 = "Bike/1/cmd";
const bikeResetTopic2 = "Bike/2/cmd";
const raceStateChange = "RaceStateChange";

client.on("connect", () => {
  console.log("✅ Connected to broker");

  let sequenzCounter = 0;
  let pulseCounter1 = 0;
  let pulseCounter2 = 0;
  let timestamp = 0;
  let fakeRaceInterval: ReturnType<typeof setTimeout> | undefined = undefined;
  let raceRunning = false;

  client.subscribe(
    [bikeResetTopic1, bikeResetTopic2,
      bikeWonTopic1, bikeWonTopic2, bikeWonTopic3,
      raceStateChange],
    (err) => {
      if (err) {
        console.error("❌ Failed to subscribe:", err);
      } else {
        console.log("📡 Subscribed to bike command/won topics");
      }
    },
  );

  client.on("message", (topic, payload) => {
    console.info('Received message:', topic, payload?.toString());
    if (topic === bikeResetTopic1 || topic === bikeResetTopic2) {
      // Start Fake Race
      console.log(`▶ Bike Reset!`);
      fakeRaceInterval = fakeRace();
      raceRunning = true;
    } else if (topic === raceStateChange && JSON.parse(payload.toString() || '{}')?.state === 'RACING') {
      console.log(`Race Starts!`);
      sendMessage(
        `Bike/1/cmd`,
        JSON.stringify({
          "reset" : true
        }));
      sendMessage(
        `Bike/2/cmd`,
        JSON.stringify({
          "reset" : true
        }));
    } else if (topic === bikeWonTopic1 || topic === bikeWonTopic2 || topic === bikeWonTopic3) {
      // Start Fake Race
      console.log(`🏁 Stopping fake race`);
      raceRunning = false;
      clearInterval(fakeRaceInterval);
    }
  });

  const fakeRace = () => {
    if(!fakeRaceInterval) {
      const startTimestamp = new Date().getTime();
      return setInterval(() => {
        if (raceRunning) {
          timestamp = new Date().getTime() - startTimestamp;
          sequenzCounter++;
          pulseCounter1 += Math.round(Math.random() * 4);
          sendBikeMessage("1", sequenzCounter, pulseCounter1, timestamp);
          pulseCounter2 += Math.round(Math.random() * 4);
          sendBikeMessage("2", sequenzCounter, pulseCounter2, timestamp);
        }
      }, INTERVAL);
    }
  }
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

import mqtt from "mqtt";

enum ShowState {
  LISTED = "LISTED",
  BEFORE_SHOW = "BEFORE_SHOW",
  BEFORE_RACE = "BEFORE_RACE",
  RACE = "RACE",
  RACE_FINISHED = "RACE_FINISHED",
  PLAYING_VIDEO = "PLAYING_VIDEO",
  VIDEO_FINISHED = "VIDEO_FINISHED",
  SHOW_FINISHED = "SHOW_FINISHED",
  BEFORE_ENCORE = "BEFORE_ENCORE",
  PLAYING_ENCORE = "PLAYING_ENCORE",
  ENCORE_FINISHED = "ENCORE_FINISHED"
}

export enum RaceState {
  WAITING_FOR_OPPONENT = "WAITING_FOR_OPPONENT",
  CANCELED = "CANCELED",
  LISTED = "LISTED",
  WAITING_TO_RACE = "WAITING_TO_RACE",
  RACING = "RACING",
  RACED = "RACED",
  ERROR = "ERROR",
  VIDEO_PLAYING = "VIDEO_PLAYING",
  DONE = "DONE",
}

// Connect to your local Bun broker
const client = mqtt.connect("mqtt://localhost:3001", {
  clientId: "fake-producer",
});
const INTERVAL = 2; // milliseconds
const MAX_BIKE_ADVANCE = 120; // 5 milliseconds
const bikeAdvanceTopic1 = "sensors/bike-1";
const bikeAdvanceTopic2 = "sensors/bike-2";
const stateChangeTopic = "state/change-unused-producer";

client.on("connect", () => {
  console.log("✅ Connected to broker");

  let bikeAdvance1 = 0;
  let bikeAdvance2 = 0;

  let sequenzCounter = 0;
  let pulseCounter1 = 0;
  let pulseCounter2 = 0;
  let timestamp = 0;

  const interval = setInterval(() => {

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

  setTimeout(() => {
    interval.close();
    client.end();
  }, INTERVAL * 500);

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

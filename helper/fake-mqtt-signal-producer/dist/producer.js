"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mqtt_1 = require("mqtt");
var RaceState;
(function (RaceState) {
    RaceState["BEFORE_SHOW"] = "BEFORE_SHOW";
    RaceState["BEFORE_RACE"] = "BEFORE_RACE";
    RaceState["RACE"] = "RACE";
    RaceState["RACE_FINISHED"] = "RACE_FINISHED";
    RaceState["PLAYING_VIDEO"] = "PLAYING_VIDEO";
    RaceState["VIDEO_FINISHED"] = "VIDEO_FINISHED";
    RaceState["SHOW_FINISHED"] = "SHOW_FINISHED";
    RaceState["BEFORE_ENCORE"] = "BEFORE_ENCORE";
    RaceState["PLAYING_ENCORE"] = "PLAYING_ENCORE";
    RaceState["ENCORE_FINISHED"] = "ENCORE_FINISHED";
})(RaceState || (RaceState = {}));
let currentRaceState = RaceState.BEFORE_SHOW;
const client = mqtt_1.default.connect('mqtt://localhost:3001');
const INTERVAL = 5;
const MAX_BIKE_ADVANCE = 120;
const bikeAdvanceTopic1 = 'sensors/bike-1';
const bikeAdvanceTopic2 = 'sensors/bike-2';
const stateChangeTopic = 'state/change';
client.on('connect', () => {
    console.log('✅ Connected to broker');
    let bikeAdvance1 = 0;
    let bikeAdvance2 = 0;
    function sendMessage(topic, value) {
        client.publish(topic, value, { qos: 1 }, (err) => {
            if (err) {
                console.error('❌ Failed to publish:', err);
            }
            else {
                console.log(`🚀 Message sent to ${topic}:`, value);
            }
        });
    }
    client.subscribe(stateChangeTopic, (err) => {
        if (!err) {
            console.log(`📥 Subscribed to ${stateChangeTopic}`);
        }
        else {
            console.error('Subscription error:', err);
        }
    });
    client.on("message", (_, payload) => {
        console.info('Received state change message:', payload?.toString());
        const stateChange = JSON.parse(payload?.toString() || '{}');
        if (stateChange.newState) {
            currentRaceState = stateChange.newState;
            console.info('Updated current race state to:', currentRaceState);
        }
    });
    const interval = setInterval(() => {
        if (currentRaceState === RaceState.BEFORE_SHOW) {
            if (Math.random() < 0.01) {
                sendMessage(stateChangeTopic, JSON.stringify({ newState: RaceState.BEFORE_RACE }));
            }
        }
        else if (currentRaceState === RaceState.BEFORE_RACE) {
            if (Math.random() < 0.01) {
                sendMessage(stateChangeTopic, JSON.stringify({ newState: RaceState.RACE }));
            }
        }
        else if (currentRaceState === RaceState.RACE) {
            if (bikeAdvance1 <= MAX_BIKE_ADVANCE && Math.random() < 0.75) {
                bikeAdvance1++;
                console.log(`Advancing Bike to ${bikeAdvance1}`);
                sendMessage(bikeAdvanceTopic1, bikeAdvance1.toString());
            }
            if (bikeAdvance2 <= MAX_BIKE_ADVANCE && Math.random() < 0.75) {
                bikeAdvance2++;
                console.log(`Advancing Bike to ${bikeAdvance2}`);
                sendMessage(bikeAdvanceTopic2, bikeAdvance2.toString());
            }
            if (bikeAdvance1 >= MAX_BIKE_ADVANCE) {
                sendMessage(stateChangeTopic, JSON.stringify({ newState: RaceState.RACE_FINISHED, bikeWon: 1 }));
            }
            else if (bikeAdvance2 >= MAX_BIKE_ADVANCE) {
                sendMessage(stateChangeTopic, JSON.stringify({ newState: RaceState.RACE_FINISHED, bikeWon: 2 }));
            }
        }
        else if (currentRaceState === RaceState.RACE_FINISHED) {
            if (Math.random() < 0.001) {
                sendMessage(stateChangeTopic, JSON.stringify({ newState: RaceState.RACE }));
            }
        }
        else if (currentRaceState === RaceState.PLAYING_VIDEO) {
            if (Math.random() < 0.01) {
                sendMessage(stateChangeTopic, JSON.stringify({ newState: RaceState.VIDEO_FINISHED }));
            }
        }
        else if (currentRaceState === RaceState.VIDEO_FINISHED) {
            if (Math.random() < 0.1) {
                sendMessage(stateChangeTopic, JSON.stringify({ newState: RaceState.BEFORE_RACE }));
            }
        }
    }, INTERVAL);
});
client.on('error', (err) => {
    console.error('Connection error:', err);
});
//# sourceMappingURL=producer.js.map
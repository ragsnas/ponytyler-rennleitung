import {Aedes} from 'aedes';
import { createServer } from 'net';
import { finished } from 'stream';

type BikeStatusMessage = {
  pulsecount: number;
  sequenz: number;
  timestamp: number;
}

interface BikeState {
  finished: boolean,
  finishObservedAtSequenz: number | undefined,
  mostRecentStatus: BikeStatusMessage,
  won: boolean | undefined
}

type BikeId = '1' | '2';

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

const MAX_BIKE_ADVANCE = 120; // 5 milliseconds
const ADDITIONAL_SEQUENCE_STORAGE = 4;

let currentRaceState: RaceState = RaceState.BEFORE_SHOW;

let bikeState: Map<BikeId, BikeState> = new Map<BikeId, BikeState>();
bikeState.set('1', {finished: false, finishObservedAtSequenz: undefined, won: undefined, mostRecentStatus: {pulsecount:0, sequenz: 0, timestamp: 0}});
bikeState.set('2', {finished: false, finishObservedAtSequenz: undefined, won: undefined, mostRecentStatus: {pulsecount:0, sequenz: 0, timestamp: 0}});
let raceFinishedDetectedAtSquenz = 0;

const port = 3001;
const broker = await Aedes.createBroker()
const server = createServer(broker.handle);

const bikeStates: Map<BikeId, BikeStatusMessage[]> = new Map<'1'|'2', BikeStatusMessage[]>([['1', []], ['2', []]]);

// Start the MQTT BrokerfinishObservedAtSequenz
server.listen(port, () => {
  console.log(`🚀 MQTT Broker started and listening on port ${port}`);
});

// Event listeners for debugging
broker.on('client', (client: Aedes.Client) => {
  console.log(`🔗 Client Connected: ${client ? client.id : 'unknown'}`);
});

broker.on('subscribe', (subscriptions: Aedes.Subscription[], client: Aedes.Client) => {
  console.log(`📝 Client ${client ? client.id : 'unknown'} subscribed to: ${subscriptions.map(s => s.topic).join(', ')}`);
});

broker.on('publish', (packet: Aedes.Packet, client: Aedes.Client) => {
  const dataBuffer = Buffer.from(packet.payload)
  const utf16Decoder = new TextDecoder('UTF-8');
  const payloadText = utf16Decoder.decode(dataBuffer);
  let payloadObject = undefined;
  try {
    payloadObject = JSON.parse(payloadText);
  } catch (e) {
    console.log(`error parsing payload`, e)
  }
  if (!payloadObject) {
    console.log(
      `📝 Client ${client ? client.id : 'unknown'} `+
      ` published unparsable payload:`,
      payloadText,
      `\n > raw packet:`,
      packet
      );        

  } else if(packet.topic.toString().match(/^Bike\/[1-2]{1}$/i)) {
    const bikeId: BikeId = packet.topic.substr(5) as BikeId; 
      if(isBikeStatusPayload(payloadObject)) { 
        if (payloadObject.pulsecount > MAX_BIKE_ADVANCE) {
          if(!bikeState.get(bikeId)?.finished) {
            console.log(
            `🏁 Bike ${bikeId} finished:`,payloadObject);
            updatePartialBikeState(
              bikeId,
              {
                finishObservedAtSequenz: payloadObject.sequenz as number,
                finished: true
              }
            ); 
            
          }
          const maxSequenzToRecord = bikeState.get(bikeId)?.finishObservedAtSequenz! + ADDITIONAL_SEQUENCE_STORAGE; 
          if(bikeState.get(bikeId)?.finished && payloadObject.sequenz < maxSequenzToRecord) {
            console.log(`📝 Adding additional state (seq ${maxSequenzToRecord}) for Bike ${bikeId}`);
            addBikeState(bikeId, payloadObject as BikeStatusMessage);
          } else if(!bikeState.get(bikeId)?.won && !bikeState.get(bikeId == '1' ? '2' : '1')?.won && bikeState.get(bikeId)?.finished && payloadObject.sequenz >= maxSequenzToRecord) {
            // analyze bike:
            console.log(
              `Analyzing Bike ${bikeId}:`
            );

            const thisBikeState: BikeState = bikeState.get(bikeId)!;
            const otherBikeState: BikeState = bikeState.get(bikeId == '1' ? '2' : '1')!;
            if(!otherBikeState.finished || otherBikeState.mostRecentStatus.timestamp > thisBikeState.mostRecentStatus.timestamp) {
              updatePartialBikeState(bikeId, {won: true});
              console.log(`🏆 Bike ${bikeId == '1' ? '1️⃣' : '2️⃣'} won! 🎉`);
            }
          }
        } else {
          addBikeState(bikeId, payloadObject as BikeStatusMessage);
        }
      }
  } else if(packet.topic.toString().match(/^Bike\/[1-2]{1}\/cmd$/i)) {
    const bikeId = packet.topic.substr(5);
    console.log(
      `📝 Client ${client ? client.id : 'unknown'} `+
      ` published command for Bike ${bikeId}:`,
      payloadText);   
  } else  {
  console.log(
    `📝 Client ${client ? client.id : 'unknown'} `+
    `published unrecognizable message [topic=${packet.topic}]: `,
    utf16Decoder.decode(dataBuffer));
    
  }
 
});

function isBikeStatusPayload(payloadObject: Object): boolean {
  return Object.hasOwn(payloadObject, 'pulsecount') && Object.hasOwn(payloadObject, 'timestamp') && Object.hasOwn(payloadObject, 'sequenz')
}

function updatePartialBikeState(bikeId: BikeId, element: any) {
  console.log(`📝 updatePartialBikeState for Bike ${bikeId}:`, element);
  bikeState.set(
    bikeId,
    {
      ...bikeState.get(bikeId),
      ...element
    })
}

function addBikeState(bikeId: BikeId, bikeStatusMessage: BikeStatusMessage) {
  const bikeStatusMessages: BikeStatusMessage[] = bikeStates.get(bikeId) || [];
  const bikeStateForThisBike: BikeState = bikeState.get(bikeId) || {finished: false, finishObservedAtSequenz: 0, mostRecentStatus: {pulsecount:0, sequenz: 0, timestamp:0}, won: false};
  bikeStatusMessages.push(bikeStatusMessage);
  if(
    (!bikeStateForThisBike.finished && bikeStatusMessage.sequenz > bikeStateForThisBike.mostRecentStatus?.sequenz)
    ||
    (bikeStateForThisBike.finished && bikeStatusMessage.pulsecount > MAX_BIKE_ADVANCE && bikeStatusMessage.sequenz < bikeStateForThisBike.mostRecentStatus?.sequenz)) {
    
      updatePartialBikeState(bikeId, {mostRecentStatus: bikeStatusMessage});
  }
  bikeStates.set(bikeId, bikeStatusMessages);
  bikeState.set(bikeId, bikeStateForThisBike);
}
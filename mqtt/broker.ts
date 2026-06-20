import {Aedes} from 'aedes';
import { createServer } from 'net';

const port = 3001;
const broker = await Aedes.createBroker()
const server = createServer(broker.handle);

// Start the MQTT Broker
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
  console.log(`📝 Client ${client ? client.id : 'unknown'} published to: ${packet.topic}: `, packet.payload);
});

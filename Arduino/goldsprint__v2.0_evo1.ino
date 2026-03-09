// Bibliotheken für Ethernet und MQTT
#include <SPI.h>
#include <Ethernet.h>
#include <PubSubClient.h>

// MAC-Adresse für Ethernet-Shield
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
// IP-Adresse deines MQTT-Brokers
IPAddress server(192, 168, 1, 100);

EthernetClient ethClient;
PubSubClient client(ethClient);

// Rollendurchmesser und Strecke
const float rollDiameter = 0.11; // 11 cm
const float rollCircumference = PI * rollDiameter; // ~0.3456 m pro Umdrehung
const int totalPulses = 723; // ca. 250 m / Umfang

// Pins für Hall-Sensoren (Interrupts)
const int hallPin1 = 2; // INT0
const int hallPin2 = 3; // INT1

// LED-Pins
const int led1Pin = 4; // LED für Sensor 1
const int led2Pin = 5; // LED für Sensor 2
const int goalLedPin = 6; // Ziel erreicht LED

// Pulszähler
volatile unsigned int pulseCount1 = 0;
volatile unsigned int pulseCount2 = 0;

// Steuerflags
bool started = false;
bool falseStartDetected = false;
unsigned long startTime = 0;
unsigned long lastSendTime = 0;
bool goalReached = false;

void setup() {
  Serial.begin(9600);
  Ethernet.begin(mac);
  client.setServer(server, 1883);

  // Interrupts für beide Sensoren
  attachInterrupt(digitalPinToInterrupt(hallPin1), onPulse1, RISING);
  attachInterrupt(digitalPinToInterrupt(hallPin2), onPulse2, RISING);

  // LED-Pins als Ausgang
  pinMode(led1Pin, OUTPUT);
  pinMode(led2Pin, OUTPUT);
  pinMode(goalLedPin, OUTPUT);

  Serial.println("System bereit. Drücke Leertaste zum Starten.");
}

void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop();

  // Eingaben über Tastatur (Serielle Konsole)
  if (Serial.available()) {
    char input = Serial.read();
    if (input == ' ') {
      startCountdown();
    } else if (input == 'R') {
      resetTrainer();
    }
  }

  // Daten senden alle 100 ms
  if (started && millis() - lastSendTime > 100) {
    sendMQTT();
    lastSendTime = millis();
  }

//oder nur senden, wenn sich Daten geändert haben:

/*static unsigned int lastPulseCount = 0;
if (pulseCount != lastPulseCount) {
  sendMQTT();
  lastPulseCount = pulseCount;
}*/

  // Ziel erreicht?
  if (!goalReached && started && (pulseCount1 >= totalPulses || pulseCount2 >= totalPulses)) {
    Serial.println("Ziel erreicht!");
    digitalWrite(goalLedPin, HIGH);
    goalReached = true;
    started = false;
  }
}

// Interrupt: Sensor 1 erkannt
void onPulse1() {
  pulseCount1++;
  digitalWrite(led1Pin, HIGH);
  delayMicroseconds(100);
  digitalWrite(led1Pin, LOW);
}

// Interrupt: Sensor 2 erkannt
void onPulse2() {
  pulseCount2++;
  digitalWrite(led2Pin, HIGH);
  delayMicroseconds(100);
  digitalWrite(led2Pin, LOW);
}

// Countdown-Funktion mit Fehlstart-Erkennung
void startCountdown() {
  Serial.println("Countdown startet:");
  int preStart1 = pulseCount1;
  int preStart2 = pulseCount2;

  for (int i = 3; i > 0; i--) {
    Serial.println(i);
    delay(1000);
  }

  Serial.println("GO!");

  // Fehlstart prüfen (Drei Pulse sind ok, muss mal im alten Code gucken, was wir da genommen haben)
  int delta1 = pulseCount1 - preStart1;
  int delta2 = pulseCount2 - preStart2;

  if (delta1 >= 3 || delta2 >= 3) {
    Serial.println("Fehlstart erkannt!");
    falseStartDetected = true;
    return;
  }

  started = true;
  goalReached = false;
  startTime = millis();
  lastSendTime = millis();
}

// MQTT-Nachricht senden
void sendMQTT() {
  float dist1 = pulseCount1 * rollCircumference;
  float dist2 = pulseCount2 * rollCircumference;
  unsigned long timestamp = millis() - startTime;

  char message[256];
  snprintf(message, sizeof(message),
           "{\"pulses1\":%u,\"dist1\":%.2f,\"pulses2\":%u,\"dist2\":%.2f,\"ts\":%lu}",
           pulseCount1, dist1, pulseCount2, dist2, timestamp);

  client.publish("rollentrainer/data", message);
  Serial.print("Gesendet: ");
  Serial.println(message);
}

// Reset-Funktion
void resetTrainer() {
  pulseCount1 = 0;
  pulseCount2 = 0;
  started = false;
  falseStartDetected = false;
  goalReached = false;
  digitalWrite(goalLedPin, LOW);
  Serial.println("System zurückgesetzt.");
}

// MQTT-Verbindung wiederherstellen
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Verbindung zu MQTT...");
    if (client.connect("RollentrainerClient")) {
      Serial.println("Verbunden.");
    } else {
      Serial.print("Fehler, Code=");
      Serial.print(client.state());
      Serial.println(". Neuversuch in 1s.");
      delay(1000);
    }
  }
}

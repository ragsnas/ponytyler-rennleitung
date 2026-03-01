// Taster-Pins
const int button1_single = 2;
const int button1_multi  = 3;
const int button2_single = 4;
const int button2_multi  = 5;

// Ausgangs-Pins zu Haupt-Arduino
const int output1 = 8;
const int output2 = 9;

// LED-Anzeigen
const int led1 = 10;
const int led2 = 11;

// Entprellung
const unsigned long debounceDelay = 50;
const int pulseDuration = 10;

// Entprell-Zustandsspeicher
bool lastState[4] = {HIGH, HIGH, HIGH, HIGH};
unsigned long lastDebounceTime[4] = {0, 0, 0, 0};

void setup() {
  Serial.begin(9600);
  
  // Taster mit Pullup
  pinMode(button1_single, INPUT_PULLUP);
  pinMode(button1_multi,  INPUT_PULLUP);
  pinMode(button2_single, INPUT_PULLUP);
  pinMode(button2_multi,  INPUT_PULLUP);

  // Outputs zu Haupt-Arduino
  pinMode(output1, OUTPUT);
  pinMode(output2, OUTPUT);
  digitalWrite(output1, HIGH);
  digitalWrite(output2, HIGH);

  // LED-Ausgänge
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  digitalWrite(led1, LOW);
  digitalWrite(led2, LOW);
}

void loop() {
  handleButton(button1_single, 0, output1, led1, false);
  handleButton(button1_multi,  1, output1, led1, true);
  handleButton(button2_single, 2, output2, led2, false);
  handleButton(button2_multi,  3, output2, led2, true);
}

void handleButton(int pin, int index, int outputPin, int ledPin, bool multi) {
  bool reading = digitalRead(pin);

  if (reading != lastState[index]) {
    lastDebounceTime[index] = millis();
    lastState[index] = reading;
  }

  if ((millis() - lastDebounceTime[index]) > debounceDelay) {
    if (reading == LOW) {
      if (multi) {
        sendMultiplePulses(outputPin, ledPin, 10);
      } else {
        sendSinglePulse(outputPin, ledPin);
      }
      delay(300); // Blockiere Mehrfachauslösung, nur einzelinpuls
    }
  }
}

void sendSinglePulse(int pin, int ledPin) {
  digitalWrite(pin, LOW);
  digitalWrite(ledPin, HIGH);
  Serial.println("Signal");
  delay(pulseDuration);
  digitalWrite(pin, HIGH);
  digitalWrite(ledPin, LOW);
  Serial.println("kein Signal");
}

void sendMultiplePulses(int pin, int ledPin, int count) {
  for (int i = 0; i < count; i++) {
    sendSinglePulse(pin, ledPin);
    delay(50);
  }
}

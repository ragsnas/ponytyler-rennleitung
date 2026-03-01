/* 
 * Für Arduino Duemilanovo
 * 2 hall sensoren loesen 
 * Externe Interrupts an digital pin 2( int0) and 3 (int1) aus
 * Interrupts low aktiv
 *
 */


int ledIn = 5;
int incomingByte = 0; // for reset

// unsigned int 65534 : 655,34 m ~
// unsigned long  4 294 967 295 cm  = 42949672,95 m  = 42949 km .. sollte reichen 
unsigned long bike0 = 0;
unsigned long bike1 = 0;
  
 

// durchmesser rolle 11 cm 
// 11 *PI = 35,556 ~ 36 
// wir rechnen alles in cm 
 const unsigned int UMFANG = 36;
// test
//const unsigned int UMFANG = 1000; //10m

                
volatile int ledState0 = LOW;
volatile int ledState1 = LOW;

volatile int flag0_send = 0;
volatile int flag1_send = 0;

// die LEDs
unsigned long currentMillis;
const int ledPin0 = 4; // gruen
const int ledPin1 = 5;// rot

// duaer led
int interval = 200;  

unsigned long previousMillis0; 
unsigned long previousMillis1; 



// the setup routine runs once when you press reset:
void setup() {       
  
  // initialize the digital pin as an output.
  pinMode(ledPin0, OUTPUT);     
  pinMode(ledPin1, OUTPUT); 
  Serial.begin(9600); 
  
  
  attachInterrupt(0, bike_null, FALLING); // DI2
  attachInterrupt(1, bike_eins, FALLING); // DI3
 
   // say hi !!
   digitalWrite(ledPin0, HIGH); 
   delay(250);
   digitalWrite(ledPin0, LOW); 
   delay(250);
   digitalWrite(ledPin0, HIGH); 
   delay(250);
   digitalWrite(ledPin0, LOW); 

  
}

// the loop routine runs over and over again forever:
void loop() {

  delay(25);
  
  if(flag1_send || flag0_send)
  {
    String str_bike = "";
    //str_bike.concat(bike0);
    //str_bike.concat(" ");
    //str_bike.concat(bike1);
    //str_bike.concat(" \n");

    String str_bike0 = bike0;
    String str_bike1 = bike1;
    String leer = (" ");
    String umbruch =("\n");
    
    str_bike = str_bike0 + leer + str_bike1 + umbruch;
    
    Serial.print(str_bike);
    // String senden an Serial Port
    
    if (flag1_send)
    {
       ledState1 = HIGH;
       digitalWrite(ledPin1, ledState1);
       //Serial.print("LICHT 1 AN !");
    }
     if (flag0_send)
    {
       ledState0 = HIGH;
       digitalWrite(ledPin0, ledState0);
       //Serial.print("LICHT  0 AN !");
     }
    
    noInterrupts();
    flag1_send = 0;
    flag0_send = 0;
    
    interrupts();
    
  }

  
  if (Serial.available() > 0) {
        // read the incoming byte:
        delay(10);

         noInterrupts();
      
        incomingByte = Serial.read();
        //Serial.print("I received: ");
        //Serial.println(incomingByte, DEC);  //Änderung Auskommentiert Fiete 26.04.15
        
        // Änderung auf 10 || 13 || 49 || 32  12-05-15 frauke 
        if(incomingByte == 49 ||  incomingByte == 32 || incomingByte == 10 ||  incomingByte == 13){   //Änderung auf 32 zweiter eintrag von ehemals 10 Fiete 26.04.15
            reset();
                   // say what you got:
       // Serial.print("I received: ");
      }
        interrupts();
    
 
       // Serial.println(incomingByte, DEC);
  }
  
   // fuer die leds
  currentMillis = millis();
 
  if((currentMillis - previousMillis0 > interval) && (ledState0 == HIGH)) {
    ledState0 = LOW;
    // set the LED with the ledState of the variable:
    digitalWrite(ledPin0, ledState0);
    //Serial.print("LICHT AUS !");
  }
   
  if((currentMillis - previousMillis1 > interval) && (ledState1 == HIGH)) {
    ledState1 = LOW;
    // set the LED with the ledState of the variable:
    digitalWrite(ledPin1, ledState1);
    //Serial.print("LICHT AUS !");
   }
 
  
}


void bike_null(){
  previousMillis0 = currentMillis;
  bike0 += UMFANG;
  flag0_send = 1;
}

void bike_eins(){
   previousMillis1 = currentMillis;
   bike1 += UMFANG;
   flag1_send = 1;
  // ledState = LOW;
}


void reset(){
  
  noInterrupts();
    //Serial.print("reset mc ");
  bike0 = 0;
  bike1 = 0;
  ledState0 = LOW;
  ledState1 = LOW;
  digitalWrite(ledPin0, ledState0);
  digitalWrite(ledPin1, ledState1);
  interrupts();

}





/*

void stateChange()
{
  state = !state;
  digitalWrite(led, state);
x++;
  Serial.print(x);
}
*/

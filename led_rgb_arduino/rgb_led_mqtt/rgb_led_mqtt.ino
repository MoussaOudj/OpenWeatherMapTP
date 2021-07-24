#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

int redpin = D5; //select the pin for the red LED
int greenpin = D6 ;// select the pin for the green LED
int bluepin = D7; // select the pin for the  blue LED
int val;
int RED_TEMP = 0;
int GREEN_TEMP = 0;
int BLUE_TEMP = 0;
StaticJsonDocument<200> doc;
String RGB_STATUS = "Off";

//WiFi Connection configuration
char ssid[] = "####";     //  le nom du reseau WIFI
char password[] = "####";  // le mot de passe WIFI
//mqtt server
char mqtt_server[] = "group5.local";  //adresse serveur
#define MQTT_USER "####" //user
#define MQTT_PASS "####" //mdp


WiFiClient espClient;
PubSubClient MQTTclient(espClient);

//Fonction connection MQTT
void MQTTconnect() {
  while (!MQTTclient.connected()) {
    Serial.print("Attente  MQTT connection...");
    String clientId = "TestClient-";
    clientId += String(random(0xffff), HEX);
    
    // test connexion
    if (MQTTclient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("connected");

    } else {  // si echec affichage erreur
      Serial.print("ECHEC, rc=");
      Serial.print(MQTTclient.state());
      Serial.println(" nouvelle tentative dans 5 secondes");
      delay(5000);
    }
  }
}

//Fonction de recuperation données rgb
String getValue(String data, char separator, int index)
{
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length() - 1;

  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i + 1 : i;
    }
  }

  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
}

//Fonction callback appelé lors de la reception d'un message sur un topic subscribed
void callback(String topic, byte* payload, unsigned int length) {

  
  Serial.print("Message arrived in topic: ");
  Serial.println(topic);
  //Init variable contenant le message
  String data;
  Serial.print("Message:");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
    data += (char)payload[i];
  }
  //Fin init

  Serial.println();

  //Gestion du topic rgb
  if (topic == "weather-station/moussa/control/rgb") {
    Serial.println(data);
    String red = getValue(data, ',', 0);
    String green = getValue(data, ',', 1);
    String blue = getValue(data, ',', 2);
    Serial.print("Red = ");
    Serial.println(red);
    Serial.print("Green = ");
    Serial.println(green);
    Serial.print("Blue = ");
    Serial.println(blue);
    //Verifie Status
    if(RGB_STATUS == "On"){
    analogWrite(redpin, green.toInt());
    analogWrite(greenpin, red.toInt());
    analogWrite(bluepin, blue.toInt());
    }else{
        analogWrite(redpin, 0);
        analogWrite(greenpin, 0);
        analogWrite(bluepin, 0);
    }
    //Gestion topic status
  } else if (topic == "weather-station/moussa/control/rgb/status"){
    DeserializationError error = deserializeJson(doc, data);
    if(error) {
      Serial.println("deserizalizeJson() failed");
      Serial.println(error.c_str());
      RGB_STATUS = "Off";
    }else {
      RGB_STATUS = String(doc["status"]);
      Serial.print("RGB STATUS PARSED = ");
      Serial.println(RGB_STATUS);
      if(RGB_STATUS == "Off"){
        analogWrite(redpin, 0);
        analogWrite(greenpin, 0);
        analogWrite(bluepin, 0);
      }
    }
    
  }
  Serial.println();
  Serial.println("-----------------------");

}

void setup() {
  Serial.begin(115200);

  pinMode(redpin, OUTPUT);
  pinMode(bluepin, OUTPUT);
  pinMode(greenpin, OUTPUT);
  // Conexion WIFI
  WiFi.begin(ssid, password);
  Serial.println("");
  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected");
  MQTTclient.setServer(mqtt_server, 1883);
  MQTTclient.setCallback(callback);
}

void loop()
{
  // connect serveur MQTT
  if (!MQTTclient.connected()) {
    MQTTconnect();
    MQTTclient.subscribe("weather-station/moussa/control/#");
  }
  MQTTclient.loop();

}

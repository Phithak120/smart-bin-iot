#include <WiFi.h>
#include <FirebaseESP32.h>
#include <PubSubClient.h> 
#include "time.h"        

// --- การตั้งค่า WiFi & Firebase ---
#define WIFI_SSID "New"
#define WIFI_PASSWORD "11111111"
#define FIREBASE_HOST "smart-trash-bin-test-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "ImtQXm9UF6E0blUlJSuwk4WhBeoz4n309o7rTX6w"

// --- การตั้งค่า MQTT ---
const char* mqtt_server = "test.mosquitto.org";
const int mqtt_port = 1883;

// --- การตั้งค่าเวลา (NTP) ---
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 25200; 
const int daylightOffset_sec = 0;

/* // --- ส่วน Hardware (ในอนาคต) ---
#include <ESP32Servo.h>
Servo myServo;
const int servoPin = 13;
const int buzzerPin = 14;
*/

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMillis = 0;
unsigned long lastControlMillis = 0; // เพิ่มสำหรับเช็คการควบคุม

// ฟังก์ชันดึงเวลาปัจจุบัน
String getTimeString() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return "N/A";
  char timeStringBuff[20];
  strftime(timeStringBuff, sizeof(timeStringBuff), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(timeStringBuff);
}

// ฟังก์ชันเชื่อมต่อ MQTT
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-" + String(random(0, 9999));
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi Connected");

  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);

  client.setServer(mqtt_server, mqtt_port);
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  /* // --- ตั้งค่าขา Pin (Hardware ในอนาคต) ---
  myServo.attach(servoPin);
  pinMode(buzzerPin, OUTPUT);
  */
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  // --- 1. ส่วนรับคำสั่งควบคุมจากเว็บ (เช็คทุกๆ 2 วินาที) ---
  if (millis() - lastControlMillis > 2000) {
    lastControlMillis = millis();

    // ดึงคำสั่งเปิด-ปิดฝาถัง
    if (Firebase.getString(fbdo, "/trash_status/lid_command")) {
      String lid_cmd = fbdo.stringData();
      if (lid_cmd == "OPEN") {
        Serial.println("Command: OPEN LID");
        // myServo.write(90); // สั่ง Hardware จริง
      } else {
        Serial.println("Command: CLOSE LID");
        // myServo.write(0);  // สั่ง Hardware จริง
      }
    }

    // ดึงคำสั่งควบคุมเสียงและระดับเสียง
    if (Firebase.getString(fbdo, "/trash_status/buzzer_mode")) {
      String b_mode = fbdo.stringData();
      int b_vol = 0;
      Firebase.getInt(fbdo, "/trash_status/buzzer_volume", &b_vol);
      
      Serial.print("Buzzer: "); Serial.print(b_mode);
      Serial.print(" | Volume: "); Serial.println(b_vol);

      /* // Logic เสียง (Hardware ในอนาคต)
      if (b_mode == "ON") {
          // สั่งดังตามระดับเสียง b_vol
      } else {
          digitalWrite(buzzerPin, LOW);
      }
      */
    }
  }

  // --- 2. ส่วนส่งข้อมูลขึ้น Firebase/MQTT (ส่งทุก 1 นาที) ---
  if (millis() - lastMillis > 60000 || lastMillis == 0) {
    lastMillis = millis();
    
    int trash_val = random(0, 101); 
    bool person_near = (random(0, 2) == 1); 
    String currentTime = getTimeString(); 

    FirebaseJson json;
    json.set("percentage", trash_val);
    json.set("is_near", person_near);
    json.set("timestamp", currentTime); 

    Firebase.updateNode(fbdo, "/trash_status", json); // ใช้ updateNode เพื่อไม่ให้ค่า lid_command หาย
    Firebase.push(fbdo, "/trash_history", json);

    client.publish("bin/trash_percent", String(trash_val).c_str());
    client.publish("bin/trash_history", currentTime.c_str());
    
    Serial.println("--- Data Synced ---");
  }
}
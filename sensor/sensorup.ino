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

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WiFiClient espClient;
PubSubClient client(espClient);

// --- ตัวแปรจับเวลา ---
unsigned long lastMillis = 0;
unsigned long lastControlMillis = 0;
unsigned long lastSimMillis = 0; // จับเวลาสำหรับการสุ่มคนเดินผ่าน

bool lastLidState = false; // เก็บสถานะฝาว่าเปิดหรือปิดอยู่

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
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  // -------------------------------------------------------------------
  // 1. จำลองคนเดินผ่านถังขยะ (สุ่มทุกๆ 10 วินาที เพื่อเทสกราฟ)
  // -------------------------------------------------------------------
  if (millis() - lastSimMillis > 10000) {
    lastSimMillis = millis();

    bool currentPersonNear = (random(0, 2) == 1); // สุ่ม 50/50 ว่ามีคนเดินมาใกล้ไหม

    // ถ้าฝาเพิ่งเปลี่ยนจาก ปิด -> เปิด
    if (currentPersonNear == true && lastLidState == false) {
      String currentTime = getTimeString(); 
      FirebaseJson lidJson;
      lidJson.set("event", "opened");
      lidJson.set("timestamp", currentTime);

      Firebase.push(fbdo, "/lid_history", lidJson); 
      Serial.println("▶ SIMULATION: คนเดินผ่าน! ยิงข้อมูลการเปิดฝาเข้า /lid_history แล้ว");
    }
    lastLidState = currentPersonNear; // อัปเดตสถานะล่าสุด
  }

  // -------------------------------------------------------------------
  // 2. ส่วนรับคำสั่งควบคุมจากเว็บ (เช็คทุกๆ 2 วินาที)
  // -------------------------------------------------------------------
  if (millis() - lastControlMillis > 2000) {
    lastControlMillis = millis();

    if (Firebase.getString(fbdo, "/trash_status/lid_command")) {
      String lid_cmd = fbdo.stringData();
      
      // ถ้ากดปุ่ม OPEN จากหน้าเว็บ ก็ให้นับเป็นการเปิดฝาเพื่อโชว์ในกราฟด้วย
      if (lid_cmd == "OPEN" && lastLidState == false) {
        String currentTime = getTimeString(); 
        FirebaseJson lidJson;
        lidJson.set("event", "manual_opened");
        lidJson.set("timestamp", currentTime);
        Firebase.push(fbdo, "/lid_history", lidJson); 
        
        Serial.println("▶ COMMAND: กดเปิดจากเว็บ! ยิงข้อมูลการเปิดฝาแล้ว");
        lastLidState = true;
      } 
      else if (lid_cmd == "CLOSE") {
        lastLidState = false;
      }
    }
  }

  // -------------------------------------------------------------------
  // 3. ส่วนส่งข้อมูลระดับขยะขึ้น Firebase (ส่งทุก 1 นาที)
  // -------------------------------------------------------------------
  if (millis() - lastMillis > 60000 || lastMillis == 0) {
    lastMillis = millis();
    
    int trash_val = random(0, 101); // สุ่มระดับขยะ
    String currentTime = getTimeString(); 

    FirebaseJson json;
    json.set("percentage", trash_val);
    json.set("is_near", lastLidState);
    json.set("timestamp", currentTime); 

    Firebase.updateNode(fbdo, "/trash_status", json); 
    Firebase.push(fbdo, "/trash_history", json);

    client.publish("bin/trash_percent", String(trash_val).c_str());
    client.publish("bin/trash_history", currentTime.c_str());
    
    Serial.println("--- Routine Data: อัปเดตปริมาณขยะ " + String(trash_val) + "% ---");
  }
}
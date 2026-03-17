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
const long gmtOffset_sec = 25200; // UTC+7
const int daylightOffset_sec = 0;

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
WiFiClient espClient;
PubSubClient client(espClient);

// --- ตัวแปรจับเวลา ---
unsigned long lastTrashMillis = 0;
unsigned long lastControlMillis = 0;
unsigned long lastSimMillis = 0;

bool lastLidState = false; // เก็บสถานะคนใกล้ (ที่ผูกกับฝา)

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
  if (!client.connected()) { reconnectMQTT(); }
  client.loop();

  // -------------------------------------------------------------------
  // 1. จำลองคนเดินผ่าน (เช็คทุก 10 วินาที และอัปเดต Real-time)
  // -------------------------------------------------------------------
  if (millis() - lastSimMillis > 10000) {
    lastSimMillis = millis();
    bool currentPersonNear = (random(0, 2) == 1); // สุ่ม 50/50

    // ✅ ส่งค่าคนใกล้ขึ้น Firebase ทันทีที่เปลี่ยน (ทำให้หน้าเว็บไม่นิ่ง)
    if (currentPersonNear != lastLidState) {
      Firebase.setBool(fbdo, "/trash_status/is_near", currentPersonNear);
      Serial.println("👤 Person Status Changed: " + String(currentPersonNear ? "NEAR" : "AWAY"));
      
      // ถ้าเปลี่ยนเป็น "มีคน" (เปิดฝา) ให้บันทึกประวัติเข้า /lid_history
      if (currentPersonNear == true) {
        FirebaseJson lidJson;
        lidJson.set("event", "opened");
        lidJson.set("timestamp", getTimeString());
        Firebase.push(fbdo, "/lid_history", lidJson);
      }
    }
    lastLidState = currentPersonNear;
  }

  // -------------------------------------------------------------------
  // 2. ส่วนรับคำสั่งควบคุมจากเว็บ (เช็คทุกๆ 2 วินาที)
  // -------------------------------------------------------------------
  if (millis() - lastControlMillis > 2000) {
    lastControlMillis = millis();
    if (Firebase.getString(fbdo, "/trash_status/lid_command")) {
      String lid_cmd = fbdo.stringData();
      
      if (lid_cmd == "OPEN" && lastLidState == false) {
        FirebaseJson lidJson;
        lidJson.set("event", "manual_opened");
        lidJson.set("timestamp", getTimeString());
        Firebase.push(fbdo, "/lid_history", lidJson);
        lastLidState = true;
      } else if (lid_cmd == "CLOSE") {
        lastLidState = false;
      }
    }
  }

  // -------------------------------------------------------------------
  // 3. ส่วนส่งข้อมูลระดับขยะ (ส่งทุก 1 นาที)
  // -------------------------------------------------------------------
  if (millis() - lastTrashMillis > 60000 || lastTrashMillis == 0) {
    lastTrashMillis = millis();
    
    int trash_val = random(0, 101); 
    String currentTime = getTimeString(); 

    // อัปเดตสถานะปัจจุบัน
    FirebaseJson statusJson;
    statusJson.set("percentage", trash_val);
    statusJson.set("is_near", lastLidState);
    statusJson.set("timestamp", currentTime); 
    Firebase.updateNode(fbdo, "/trash_status", statusJson); 

    // เก็บประวัติลง Trash History
    Firebase.push(fbdo, "/trash_history", statusJson);

    // ส่งผ่าน MQTT
    client.publish("bin/trash_percent", String(trash_val).c_str());
    
    Serial.println("📊 Trash Updated: " + String(trash_val) + "% at " + currentTime);
  }
}
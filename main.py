import time;
from adafruit_extended_bus import ExtendedI2C as I2C
import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn
from gpiozero import OutputDevice
import pickle
import pandas as pd
import paho.mqtt.client as mqtt
import ssl;
import json
import os
import datetime
from dotenv import load_dotenv

load_dotenv()

AWS_ENDPOINT = os.getenv("AWS_ENDPOINT")
CA_PATH = os.getenv("CA_PATH")
CERT_PATH = os.getenv("CERT_PATH")
KEY_PATH = os.getenv("KEY_PATH")

relay = OutputDevice(17, active_high=False, initial_value=False)
# Initialize I2C and ADS1115
try:
    i2c = I2C(1)
    ads = ADS.ADS1115(i2c)
    soil_channel = AnalogIn(ads, 1)
except Exception as e:
    print(f"Critical startup error. Soil sensor not found: {e}")
    exit(1)

client = mqtt.Client()
client.tls_set(ca_certs=CA_PATH, certfile=CERT_PATH, keyfile=KEY_PATH,cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)
print("Connecting to AWS IoT Core...")
try:
    client.connect(AWS_ENDPOINT, 8883, keepalive=60)
    print("Connected to AWS IoT Core successfully!")
except Exception as e:
    print(f"Error connecting to AWS IoT Core: {e}")
    exit(1)

client.loop_start()  # Start the MQTT client loop in a separate thread

try:
    # Open the box and load the ML model created by the other script
    print("Loading AI...")
    with open('./model/potty_model.pkl', 'rb') as f:
        ai_model = pickle.load(f)
    print("AI model loaded successfully!")
except Exception as e:
    # If we reach this point, the training script was not run first
    print(f"Error loading AI model: {e}. Have you run the training script first?")
    exit(1)


def read_dht11():
    temperature_file="/sys/bus/iio/devices/iio:device0/in_temp_input"
    humidity_file="/sys/bus/iio/devices/iio:device0/in_humidityrelative_input"
    try:
        with open(temperature_file, "r") as f:
            raw_temperature = int(f.read())
        with open(humidity_file, "r") as f:
            raw_humidity = int(f.read())
            
        real_temperature = raw_temperature / 1000
        real_humidity = raw_humidity / 1000
        
        return real_temperature, real_humidity
    except Exception:
        print("Sensor read error or hardware configuration issue")
        return None, None

def humidity_map(read_value, max_value, min_value):
    percent = (max_value - read_value) * 100 / (max_value - min_value)
    
    if percent > 100:
        return 100
    elif percent < 0:
        return 0
    else:
        return round(percent, 1)
try:
    while True:
        try:
            raw_value = soil_channel.value
            temp, hum = read_dht11()
            soil_hum = humidity_map(raw_value, 17080, 10500)
            
            if temp is not None and hum is not None:
                current_conditions = pd.DataFrame(
                    [[temp, hum, soil_hum]],
                    columns=['Temperature', 'Air_Humidity', 'Soil_Humidity']
                )
                payload = {
                    "Device": "Planterra",
                    "Temperature": temp,
                    "Air_Humidity": hum,
                    "Soil_Humidity": soil_hum,
                    "Timestamp": datetime.datetime.now().isoformat()
                }
                message = json.dumps(payload)
                client.publish("test/topic", message, qos=1)
                time.sleep(60)
                # Ask the AI what action to take
                ai_decision = ai_model.predict(current_conditions)[0]
                
                if ai_decision == 1:  
                    print("AI decided: soil is dry. Pumping a dose of water...")
                    relay.on()
                    payload = {
                        "Device": "Planterra",
                        "Relay": "on",
                        "Timestamp": datetime.datetime.now().isoformat()
                    }
                    message = json.dumps(payload)
                    client.publish("test/topic", message, qos=1)
                    time.sleep(5)  # Pump runs for EXACTLY 5 seconds (adjust based on your pump size)
                    relay.off()    # Force the pump off
                    payload = {
                        "Device": "Planterra",
                        "Relay": "off",
                        "Timestamp": datetime.datetime.now().isoformat()
                    }
                    message = json.dumps(payload)
                    client.publish("test/topic", message, qos=1)
                    
                    
                    
                else:  
                    print("AI decided: soil is moist enough. Pump remains OFF.")
                    # Ensure the relay is off, just in case
                    if relay.is_active:
                        relay.off()
                        payload = {
                            "Device": "Planterra",
                            "Relay": "off",
                            "Timestamp": datetime.datetime.now().isoformat()
                        }
                        message = json.dumps(payload)
                        client.publish("test/topic", message, qos=1)
            else:
                # If the DHT11 fails, we need to know about it.
                print("Waiting for valid DHT11 sensor data...")

        except Exception as e:
            print(f"Hardware error: {e}. Turning off the pump for safety.")
            if relay.is_active:
                relay.off()
        
        # Standard heartbeat: check conditions every 1h IF not currently watering
        time.sleep(3600)
except KeyboardInterrupt:
    print("Program is closed")
    client.loop_stop()
    client.disconnect()
        

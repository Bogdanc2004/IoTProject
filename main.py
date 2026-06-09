import time;
from adafruit_extended_bus import ExtendedI2C as I2C
import adafruit_ads1x15.ads1115 as ADS
from adafruit_ads1x15.analog_in import AnalogIn
from gpiozero import OutputDevice

relay = OutputDevice(17, active_high=False, initial_value=False)

def read_dht11():
    temperature_file="/sys/bus/iio/devices/iio:device0/in_temp_input"
    humidity_file="/sys/bus/iio/devices/iio:device0/in_humidityrelative_input"
    try:
        with open(temperature_file, "r") as f:
            raw_temperature=int(f.read())
        with open(humidity_file, "r") as f:
            raw_humidity=int(f.read())
            
        real_temperature=raw_temperature/1000;
        real_humidity=raw_humidity/1000;
        
        return real_temperature, real_humidity
    except Exception as e:
        print(f"Sensor may be in danger or HW config is the problem")
        return None, None

def capacitative_humidity_sensor():
    i2c=I2C(1)
    ads=ADS.ADS1115(i2c)
    channel=AnalogIn(ads, 1)
    return channel.value

def umiditymap(read_value, max_value, min_value):
    percent=(max_value-read_value)*100/(max_value-min_value)
    
    if percent>100:
        return 100
    elif percent<0:
        return 0
    else: 
        return round(percent,1)

while(True):
    temp, hum=read_dht11();
    soil_hum=umiditymap(capacitative_humidity_sensor(), 17080, 10500)
    chanel=capacitative_humidity_sensor()
    
    if temp is not None and hum is not None:
        print(f"Temperature: {temp}*C, humidity: {hum}%")
    print(f"Soil humidity: {soil_hum}%")
    
    if soil_hum<30:
        if not relay.is_active:
            print("Dry soil")
            relay.on()
    else:
        if relay.is_active:
            print("Wet soil")
            relay.off()
    time.sleep(3)
        

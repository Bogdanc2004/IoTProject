import pandas as pd
import numpy as np

days_simulated = 365
readings_per_day = 24
total_readings = days_simulated * readings_per_day
time=np.arange(total_readings)
temperature = np.sin(2 * np.pi * time / readings_per_day) * 10 + 20 + np.random.normal(0, 1, total_readings)
air_humidity = 70-2.5 *(temperature-15)+np.random.normal(0, 5, total_readings)
soil_humidity = np.zeros(total_readings)
relay = np.zeros(total_readings)
real_level_soil=80.

def generate_synthetic_data(days_simulated, readings_per_day):
    global real_level_soil
    for i in range(total_readings):
        rate_of_drying = 0.5+0.05*(temperature[i]-15)+0.02*(air_humidity[i]-50)
        real_level_soil -= rate_of_drying
        read_soil = real_level_soil + np.random.normal(0, 2)
        soil_humidity[i] = read_soil
        watering_threshold = 30+0.5*(temperature[i]-15)-0.1*(air_humidity[i]-50)
        if read_soil < watering_threshold:
            relay[i] = 1
            real_level_soil = 85.0
        else:
            relay[i] = 0
    synthetic_data = pd.DataFrame({
        'Temperature': temperature,
        'Air_Humidity': air_humidity,
        'Soil_Humidity': soil_humidity,
        'Relay': relay
    })
    return synthetic_data

synthetic_data = generate_synthetic_data(days_simulated, readings_per_day)
synthetic_data.to_csv('./data/synthetic_plant_data.csv', index=False)
print(f"Synthetic data generated and saved to 'synthetic_plant_data.csv' with {total_readings} readings.")
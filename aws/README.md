# Planta - AWS Backend Setup Guide

This guide walks you through deploying the Planta backend infrastructure on AWS.

## Prerequisites

- AWS CLI installed and configured (`aws configure`)
- AWS SAM CLI installed ([install guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- An AWS account with appropriate permissions

## 1. Deploy the Stack

```bash
cd aws

# Build the SAM application
sam build

# Deploy (first time - guided)
sam deploy --guided
```

During guided deployment, accept the defaults and provide a stack name like `planta-backend`.

## 2. Note the Outputs

After deployment, SAM will output:

- **ApiEndpoint** - Your API Gateway URL
- **UserPoolId** - Cognito User Pool ID
- **UserPoolClientId** - Cognito Client ID

## 3. Configure the Frontend

Create a `.env` file in the project root:

```
VITE_API_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
```

Then update `src/services/auth.js`:
1. Uncomment the Cognito section at the bottom
2. Remove or comment out the mock implementations

Update `src/services/api.js`:
1. Replace mock function bodies with real `fetch()` calls to `import.meta.env.VITE_API_URL`

## 4. Connect Your IoT Device

Your device should publish MQTT messages to the topic:
```
planta/{deviceId}/sensors
```

Message format:
```json
{
  "deviceId": "device-001",
  "timestamp": 1234567890,
  "temperature": 22.5,
  "airHumidity": 65.3,
  "soilHumidity": 45.2,
  "relay": 0
}
```

### IoT Core Setup

1. Go to AWS IoT Core console
2. Create a "Thing" for your device
3. Download the certificates
4. Create an IoT policy allowing publish to `planta/+/sensors`
5. Configure your device firmware to use the certificates and publish data

### Example Arduino/MicroPython publish:

```python
# MicroPython example
import json
from umqtt.simple import MQTTClient

client = MQTTClient(
    client_id="planta-device-001",
    server="your-iot-endpoint.iot.region.amazonaws.com",
    port=8883,
    ssl=True,
    ssl_params={"certfile": "cert.pem", "keyfile": "private.key", "ca_certs": "root-CA.pem"}
)

client.connect()

data = {
    "deviceId": "device-001",
    "timestamp": time.time() * 1000,
    "temperature": dht_sensor.temperature,
    "airHumidity": dht_sensor.humidity,
    "soilHumidity": soil_sensor.read(),
    "relay": relay_pin.value()
}

client.publish("planta/device-001/sensors", json.dumps(data))
```

## 5. Cleanup

To delete all AWS resources:

```bash
sam delete --stack-name planta-backend
```

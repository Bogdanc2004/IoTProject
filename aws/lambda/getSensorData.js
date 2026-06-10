const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const deviceId = event.pathParameters.deviceId;
  const hours = parseInt(event.queryStringParameters?.hours || '24', 10);

  // Calculate timestamp range
  const now = Date.now();
  const startTime = now - hours * 3600000;

  try {
    const result = await ddb.send(new QueryCommand({
      TableName: process.env.SENSOR_DATA_TABLE,
      KeyConditionExpression: 'deviceId = :did AND #ts >= :start',
      ExpressionAttributeNames: { '#ts': 'timestamp' },
      ExpressionAttributeValues: {
        ':did': deviceId,
        ':start': startTime,
      },
      ScanIndexForward: true,
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result.Items || []),
    };
  } catch (err) {
    console.error('Error fetching sensor data:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to fetch sensor data' }),
    };
  }
};

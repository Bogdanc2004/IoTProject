const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  const userId = event.requestContext.authorizer.claims.sub;
  const body = JSON.parse(event.body || '{}');

  if (!body.name || !body.type) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'name and type are required' }),
    };
  }

  const plant = {
    userId,
    plantId: `plant-${crypto.randomUUID()}`,
    name: body.name,
    type: body.type,
    deviceId: body.deviceId || `device-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: Date.now(),
    status: 'healthy',
  };

  try {
    await ddb.send(new PutCommand({
      TableName: process.env.PLANTS_TABLE,
      Item: plant,
    }));

    return {
      statusCode: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(plant),
    };
  } catch (err) {
    console.error('Error creating plant:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to create plant' }),
    };
  }
};

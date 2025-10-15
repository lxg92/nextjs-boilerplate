import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const dynamoClient = DynamoDBDocumentClient.from(client);

export const TABLES = {
  USERS: process.env.DYNAMODB_USERS_TABLE || 'voice-app-users',
  SESSIONS: process.env.DYNAMODB_SESSIONS_TABLE || 'voice-app-sessions',
  RECORDINGS: process.env.DYNAMODB_RECORDINGS_TABLE || 'voice-app-recordings',
  SUBSCRIPTIONS: process.env.DYNAMODB_SUBSCRIPTIONS_TABLE || 'voice-app-subscriptions',
} as const;

export interface DynamoDBItem {
  [key: string]: any;
}

export const putItem = async (tableName: string, item: DynamoDBItem) => {
  const { PutCommand } = await import('@aws-sdk/lib-dynamodb');
  return dynamoClient.send(new PutCommand({
    TableName: tableName,
    Item: item,
  }));
};

export const getItem = async (tableName: string, key: Record<string, any>) => {
  const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
  return dynamoClient.send(new GetCommand({
    TableName: tableName,
    Key: key,
  }));
};

export const updateItem = async (tableName: string, key: Record<string, any>, updateExpression: string, expressionAttributeValues: Record<string, any>) => {
  const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
  return dynamoClient.send(new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  }));
};

export const deleteItem = async (tableName: string, key: Record<string, any>) => {
  const { DeleteCommand } = await import('@aws-sdk/lib-dynamodb');
  return dynamoClient.send(new DeleteCommand({
    TableName: tableName,
    Key: key,
  }));
};

export const queryItems = async (tableName: string, keyConditionExpression: string, expressionAttributeValues: Record<string, any>, indexName?: string) => {
  const { QueryCommand } = await import('@aws-sdk/lib-dynamodb');
  return dynamoClient.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    IndexName: indexName,
  }));
};


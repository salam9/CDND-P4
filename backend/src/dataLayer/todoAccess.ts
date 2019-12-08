import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new AWS.S3({
  signatureVersion: 'v4'
})

import { TodoItem } from '../models/TodoItem'

export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.IMAGES_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
    ) { }

  async GetAllTodos(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todos')

    const result = await this.docClient.query({
      TableName: this.todoTable,
      KeyConditionExpression: "#userId = :userId",
      ExpressionAttributeNames:{
        "#userId": "userId"
      },
      ExpressionAttributeValues: {
        ":userId": userId
      }
    }).promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async CreateTodo(todo): Promise<TodoItem> {
    console.log('creating todo')
    console.log(todo);
    await this.docClient.put({
      TableName: this.todoTable,
      Item: todo
    }).promise()
    return todo;
  }

  async DeleteTodo(userId: string, todoId: string): Promise<TodoItem[]> {
    console.log('Deleting todo')
    // const createdAt = await this.getCreatedAt(userId, todoId);
    console.log("todoID is " + todoId + " userID is " + userId)
    await this.docClient.delete({
      TableName: this.todoTable,
      Key: {
        userId,
        todoId
      }
    }).promise()
    return [];
  }

  async UpdateTodo(userId: string, todoId: string, updatedTodo): Promise<TodoItem> {
    console.log('Updating todo')

    await this.docClient.update({
      TableName: this.todoTable,
      Key: { userId, todoId },
      UpdateExpression: 'set #name = :n, dueDate = :dd, done = :d',
      ExpressionAttributeValues: {
        ':n': updatedTodo.name,
        ':dd': updatedTodo.dueDate,
        ':d': updatedTodo.done
      },
      ExpressionAttributeNames: {
        "#name": "name"
      }
    }).promise();
    return updatedTodo;
  }

  async GenerateUrl(userId: string, todoId: string): Promise<string> {
    console.log('generating todo')

    const url = s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.urlExpiration
    })
    const newUrl = url.split('?')[0];

    await this.docClient.update({
      TableName: this.todoTable,
      Key: { userId, todoId },
      UpdateExpression: 'set attachmentUrl = :a',
      ExpressionAttributeValues: {
        ':a': newUrl
      },
    }).promise();
    return url;
  }

  async getCreatedAt(userId: string, todoId: string): Promise<string> {
    console.log("getCreatedAt enter ")
    console.log("todoID is " + todoId +" userId is " + userId);
    const result = await this.docClient.query({
      TableName: this.todoTable,
      KeyConditionExpression: 'todoId = :todoId and userId = :userId',
      ExpressionAttributeValues: {
        ':todoId': todoId,
        ':userId': userId
      }
    }).promise()
    const createdTime = result.Items[0].createdAt;
    console.log("todoID is " + todoId + " CreatedTime is " + createdTime);
    return createdTime ;
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}

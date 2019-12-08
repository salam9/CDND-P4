// import * as uuid from 'uuid'
import { APIGatewayProxyEvent } from 'aws-lambda';

import { TodoItem } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { getUserId } from '../lambda/utils'
import * as uuid from 'uuid';

const todoAccess = new TodoAccess()

export async function getAllTodos(event: APIGatewayProxyEvent): Promise<TodoItem[]> {
  return await todoAccess.GetAllTodos(getUserId(event));
}

export async function createTodo(event: APIGatewayProxyEvent): Promise<TodoItem> {
  const userId = getUserId(event);
  const todoId = uuid.v4(); 
  const createdAt = new Date().toISOString()
  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  const newItem = {
    userId,
    todoId,
	  createdAt,
    done: false,
    ... newTodo,
  }
  return await todoAccess.CreateTodo(newItem)
}

export async function deleteTodo (event: APIGatewayProxyEvent): Promise<TodoItem[]> {
  const todoId = event.pathParameters.todoId;
  // const userId = event.requestContext.authorizer['principalId']
  const userId = getUserId(event);
  return await todoAccess.DeleteTodo(userId, todoId);
}

export async function updateTodo(event: APIGatewayProxyEvent): Promise<TodoItem> {
  const userId = getUserId(event);
  const todoId = event.pathParameters.todoId;
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  return await todoAccess.UpdateTodo(userId, todoId, updatedTodo);
}

export async function generateUrl(event: APIGatewayProxyEvent): Promise<String> {
  const userId = getUserId(event);
  const todoId = event.pathParameters.todoId;
  return await todoAccess.GenerateUrl(userId, todoId);
}
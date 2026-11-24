import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ErrorResponseDto } from '../auth/dtos/error-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/types/jwt-payload.js';
import type { Todo } from '../generated/prisma/client.js';
import { CreateTodoDto } from './dtos/create-todo.dto.js';
import { ListTodosQueryDto } from './dtos/list-todos-query.dto.js';
import { TodoNotFoundResponseDto } from './dtos/todo-not-found-response.dto.js';
import { TodoResponseDto } from './dtos/todo-response.dto.js';
import { UpdateTodoDto } from './dtos/update-todo.dto.js';
import { TodoService } from './todo.service.js';

@ApiTags('todos')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodoController {
  constructor(private readonly todos: TodoService) {}

  @Post()
  @ApiOperation({ summary: 'Create a todo' })
  @ApiCreatedResponse({ type: TodoResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() data: CreateTodoDto,
  ): Promise<Todo> {
    return this.todos.create(user.sub, data);
  }

  @Get()
  @ApiOperation({ summary: 'List your todos' })
  @ApiOkResponse({ type: TodoResponseDto, isArray: true })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query(new ValidationPipe({ transform: true })) query: ListTodosQueryDto,
  ): Promise<Todo[]> {
    return this.todos.findAll(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of your todos' })
  @ApiOkResponse({ type: TodoResponseDto })
  @ApiNotFoundResponse({ type: TodoNotFoundResponseDto })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Todo> {
    return this.todos.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update one of your todos' })
  @ApiOkResponse({ type: TodoResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: TodoNotFoundResponseDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateTodoDto,
  ): Promise<Todo> {
    return this.todos.update(user.sub, id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete one of your todos' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: TodoNotFoundResponseDto })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.todos.remove(user.sub, id);
  }
}

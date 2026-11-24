import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma, type Todo } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTodoDto } from './dtos/create-todo.dto.js';
import type { ListTodosQueryDto } from './dtos/list-todos-query.dto.js';
import type { UpdateTodoDto } from './dtos/update-todo.dto.js';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateTodoDto): Promise<Todo> {
    return this.prisma.todo.create({
      data: { userId, title: data.title, description: data.description },
    });
  }

  findAll(
    userId: string,
    { limit = 20, offset = 0 }: ListTodosQueryDto,
  ): Promise<Todo[]> {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      skip: offset,
    });
  }

  async findOne(userId: string, id: string): Promise<Todo> {
    const todo = await this.prisma.todo.findFirst({ where: { id, userId } });
    if (!todo) {
      throw new NotFoundException('Todo not found.');
    }
    return todo;
  }

  async update(userId: string, id: string, data: UpdateTodoDto): Promise<Todo> {
    // Keep the ownership check inside the write to avoid a check-then-write race.
    try {
      return await this.prisma.todo.update({
        where: { id, userId },
        data: {
          title: data.title,
          description: data.description,
          completed: data.completed,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Todo not found.');
      }
      throw error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      await this.prisma.todo.delete({ where: { id, userId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Todo not found.');
      }
      throw error;
    }
  }
}

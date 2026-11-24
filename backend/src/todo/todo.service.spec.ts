import { NotFoundException } from '@nestjs/common';

import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { TodoService } from './todo.service.js';

describe('TodoService', () => {
  const userId = 'user-1';
  const id = 'todo-1';
  const todo = { id, userId, title: 'Buy groceries' };
  const prisma = {
    todo: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  const service = new TodoService(prisma as unknown as PrismaService);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a todo for the signed-in user', async () => {
    prisma.todo.create.mockResolvedValue(todo);

    await expect(service.create(userId, { title: todo.title })).resolves.toBe(
      todo,
    );
    expect(prisma.todo.create).toHaveBeenCalledWith({
      data: { userId, title: todo.title, description: undefined },
    });
  });

  it('lists only the signed-in user’s todos', async () => {
    prisma.todo.findMany.mockResolvedValue([todo]);

    await expect(service.findAll(userId, {})).resolves.toEqual([todo]);
    expect(prisma.todo.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 20,
      skip: 0,
    });
  });

  it('applies the requested page size and offset', async () => {
    prisma.todo.findMany.mockResolvedValue([]);

    await service.findAll(userId, { limit: 10, offset: 20 });
    expect(prisma.todo.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 10,
      skip: 20,
    });
  });

  it('returns 404 when the todo is not owned by the user', async () => {
    prisma.todo.findFirst.mockResolvedValue(null);

    await expect(service.findOne(userId, id)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.todo.findFirst).toHaveBeenCalledWith({
      where: { id, userId },
    });
  });

  it('scopes updates to both todo and user', async () => {
    prisma.todo.update.mockResolvedValue({ ...todo, completed: true });

    await service.update(userId, id, { completed: true });
    expect(prisma.todo.update).toHaveBeenCalledWith({
      where: { id, userId },
      data: { title: undefined, description: undefined, completed: true },
    });
  });

  it('returns the todo-specific 404 for a missing update', async () => {
    prisma.todo.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '7.10.1',
      }),
    );

    await expect(service.update(userId, id, {})).rejects.toThrow(
      new NotFoundException('Todo not found.'),
    );
  });

  it('scopes deletes to both todo and user', async () => {
    prisma.todo.delete.mockResolvedValue(todo);

    await service.remove(userId, id);
    expect(prisma.todo.delete).toHaveBeenCalledWith({ where: { id, userId } });
  });

  it('returns the todo-specific 404 for a missing delete', async () => {
    prisma.todo.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '7.10.1',
      }),
    );

    await expect(service.remove(userId, id)).rejects.toThrow(
      new NotFoundException('Todo not found.'),
    );
  });
});

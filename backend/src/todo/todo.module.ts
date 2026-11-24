import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TodoController } from './todo.controller.js';
import { TodoService } from './todo.service.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [TodoController],
  providers: [TodoService],
})
export class TodoModule {}

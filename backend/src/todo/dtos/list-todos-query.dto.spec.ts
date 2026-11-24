import { BadRequestException, ValidationPipe } from '@nestjs/common';

import { ListTodosQueryDto } from './list-todos-query.dto.js';

describe('ListTodosQueryDto', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const metadata = {
    type: 'query' as const,
    metatype: ListTodosQueryDto,
  };

  it('converts valid query parameters to numbers', async () => {
    await expect(
      pipe.transform({ limit: '10', offset: '20' }, metadata),
    ).resolves.toMatchObject({ limit: 10, offset: 20 });
  });

  it.each([
    { limit: '0' },
    { limit: '101' },
    { limit: '1.5' },
    { offset: '-1' },
    { offset: 'not-a-number' },
  ])('rejects invalid pagination: %j', async (query) => {
    await expect(pipe.transform(query, metadata)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

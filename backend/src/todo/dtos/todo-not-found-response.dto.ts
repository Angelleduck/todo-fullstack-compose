import { ApiProperty } from '@nestjs/swagger';

export class TodoNotFoundResponseDto {
  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({ example: 'Todo not found.' })
  message: string;

  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({
    example: '/todos/556c89a2-e2a3-441f-a567-7366eab58217',
  })
  path: string;

  @ApiProperty({ format: 'date-time' })
  timestamp: string;
}

import { ApiProperty } from '@nestjs/swagger';

/**
 * Shape produced by `AllExceptionsFilter` for every failed request.
 */
export class ErrorResponseDto {
  @ApiProperty({ example: 'INVALID_CREDENTIALS' })
  error: string;

  @ApiProperty({ example: 'Invalid email or password.' })
  message: string;

  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: '/auth/login' })
  path: string;

  @ApiProperty({ format: 'date-time' })
  timestamp: string;

  @ApiProperty({ type: [String], required: false })
  details?: string[];
}

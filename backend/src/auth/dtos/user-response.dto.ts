import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Alex' })
  name: string;

  @ApiProperty({ example: 'alex@example.com' })
  email: string;

  @ApiProperty({ example: false })
  email_verified: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

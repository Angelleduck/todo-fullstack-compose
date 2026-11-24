import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TodoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'Buy groceries' })
  title: string;

  @ApiPropertyOptional({ example: 'Milk and bread', nullable: true })
  description: string | null;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

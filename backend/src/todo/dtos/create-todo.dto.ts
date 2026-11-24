import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTodoDto {
  @ApiProperty({ example: 'Buy groceries', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Title cannot be blank.' })
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Milk and bread' })
  @IsOptional()
  @IsString()
  description?: string;
}

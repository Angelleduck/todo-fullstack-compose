import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTodoDto {
  @ApiPropertyOptional({ example: 'Buy groceries', maxLength: 255 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Title cannot be blank.' })
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Milk and bread', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: true })
  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  completed?: boolean;
}

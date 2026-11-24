import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Alex', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'Invalid name.',
  })
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'alex@example.com', format: 'email', maxLength: 50 })
  @IsEmail()
  @MaxLength(50)
  email: string;

  @ApiProperty({
    example: 'correct-horse-battery',
    minLength: 8,
    maxLength: 50,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;
}

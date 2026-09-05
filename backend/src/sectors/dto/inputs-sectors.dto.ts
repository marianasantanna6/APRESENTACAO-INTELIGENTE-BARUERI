import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSectorsDto {
  @IsNotEmpty()
  @IsString()
  name!: string;
}
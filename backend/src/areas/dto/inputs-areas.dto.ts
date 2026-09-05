import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAreasDto {
  @IsNotEmpty()
  @IsString()
  name!: string;
}
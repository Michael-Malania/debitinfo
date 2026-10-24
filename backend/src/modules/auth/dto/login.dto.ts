import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'ელ-ფოსტა, პირადი ნომერი ან საგადასახადო კოდი სავალდებულოა' })
  identifier: string;

  @IsString()
  @IsNotEmpty({ message: 'პაროლი სავალდებულოა' })
  password: string;
}

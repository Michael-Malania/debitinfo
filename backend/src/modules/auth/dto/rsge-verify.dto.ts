import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RsGeVerifyDto {
  @IsString()
  @IsNotEmpty({ message: 'RS.GE AuthKey სავალდებულოა' })
  authKey: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'არასწორი სისტემური როლი' })
  role?: UserRole;
}

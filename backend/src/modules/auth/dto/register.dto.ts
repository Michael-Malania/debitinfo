import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';
import { EntityType, UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'გთხოვთ მიუთითოთ ვალიდური ელ-ფოსტა' })
  @IsNotEmpty({ message: 'ელ-ფოსტა სავალდებულოა' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან' })
  @IsNotEmpty({ message: 'პაროლი სავალდებულოა' })
  password: string;

  @IsString()
  @Matches(/^\d{9}$|^\d{11}$/, {
    message: 'საიდენტიფიკაციო კოდი უნდა იყოს 9 ციფრი (იურიდიული პირი) ან 11 ციფრი (პირადი ნომერი)',
  })
  @IsNotEmpty({ message: 'პირადი ნომერი ან საიდენტიფიკაციო კოდი სავალდებულოა' })
  personalId: string;

  @IsEnum(EntityType, { message: 'ტიპი უნდა იყოს PHYSICAL ან LEGAL' })
  @IsNotEmpty({ message: 'სუბიექტის ტიპი სავალდებულოა' })
  entityType: EntityType;

  @IsOptional()
  @IsEnum(UserRole, { message: 'არასწორი სისტემური როლი' })
  role?: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  // Individual Profile Fields
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  actualAddress?: string;

  @IsOptional()
  @IsString()
  legalAddress?: string;

  // Company Profile Fields
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  legalForm?: string;

  @IsOptional()
  @IsString()
  directorName?: string;

  @IsOptional()
  @IsString()
  directorLastName?: string;

  @IsOptional()
  @IsString()
  directorPin?: string;

  @IsOptional()
  @IsString()
  directorPhone?: string;

  @IsOptional()
  @IsString()
  directorEmail?: string;
}

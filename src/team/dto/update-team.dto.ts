import { IsOptional, IsString } from 'class-validator';
import { CreateTeamDto } from './create-team.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateTeamDto extends PartialType(CreateTeamDto) {
  @IsString()
  @IsOptional()
  name?: string;
}

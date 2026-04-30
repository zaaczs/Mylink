import { IsString, MinLength } from "class-validator";

export class SaveMetaManualDto {
  @IsString()
  @MinLength(10)
  accessToken!: string;

  @IsString()
  @MinLength(1)
  pageId!: string;

  @IsString()
  @MinLength(1)
  igUserId!: string;
}

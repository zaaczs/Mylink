import { IsString, MinLength } from "class-validator";

export class SendDmDto {
  @IsString()
  @MinLength(5)
  commentId!: string;

  @IsString()
  @MinLength(1)
  message!: string;
}

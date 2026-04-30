import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsString } from "class-validator";

export class CreateTriggerAutomationDto {
  @IsString()
  postId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  keywords!: string[];

  @IsBoolean()
  replyToCommentEnabled!: boolean;

  /** Três textos de resposta pública (podem ser vazios se o toggle estiver desligado). */
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  commentReplyVariants!: string[];
}

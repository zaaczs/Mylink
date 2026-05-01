import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsString } from "class-validator";

export class UpdateTriggerAutomationDto {
  @IsString()
  postId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  keywords!: string[];

  @IsBoolean()
  replyToCommentEnabled!: boolean;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  commentReplyVariants!: string[];
}

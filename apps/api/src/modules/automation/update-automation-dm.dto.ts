import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateAutomationDmDto {
  /** Texto principal (use {link} no texto ou o URL será colocado ao final no fallback em texto). */
  @IsString()
  @MinLength(2)
  body!: string;

  @IsString()
  @MinLength(4)
  link!: string;

  /** Texto do botão "Abrir link" (template genérico; se a Meta não aceitar, cai no envio só texto). */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  linkButtonTitle?: string;

  /** Título opcional do card; se vazio, usamos o início do corpo da mensagem. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  linkCardTitle?: string;
}

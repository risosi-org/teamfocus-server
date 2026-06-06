import { IsNumber, IsString } from "class-validator";



export class CreateUploadDto {
    @IsString()
    url!: string;
    @IsString()
    filename!: string;
    @IsString()
    filepath!: string;
    @IsString()
    mimetype!: string;
    @IsNumber()
    size!: number;
    @IsString()
    sessionId!: string;
}

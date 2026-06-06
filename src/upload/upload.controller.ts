import {
  Controller,
  Delete,
  FileValidator,
  Get,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';


import { QueryUploadDto } from './dto/query-upload.dto';
import { Auth, CRUser } from '../auth/auth.decorator';
import { User } from '../generated/prisma/client';


export class FileSizeValidator extends FileValidator<{maxSize?: number}> {
 
  /**
   * Indicates if this file should be considered valid, according to the options passed in the constructor.
   * @param file the file from the request object
   */
  isValid(file?: any): boolean {
    if (!file) return false;
    const maxSize = (this.validationOptions.maxSize || 5) * 1024 * 1024; // 5MB
    return file.size <= maxSize;
  }

  /**
   * Builds an error message in case the validation fails.
   * @param file the file from the request object
   */
   buildErrorMessage(file: any): string{
    return `File ${file.originalname} exceeds the maximum allowed size of 5MB.`;
   }
}






@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Auth("ADMIN","USER")
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile( new ParseFilePipe({
    validators: [new FileSizeValidator({maxSize: 5})], // 5MB
  })) file: Express.Multer.File, @Query('sessionId') sessionId: string, @Req() req: Request) {
    return await this.uploadService.upload(file, sessionId, req);
  }

  @Auth()
  @Get()
  findAll(@Query() query: QueryUploadDto, @CRUser() user: User) {
    return this.uploadService.findAll(query, user);
  }

  @Auth()
  @Get(':id')
  findOne(@Param('id') id: string, @CRUser() user: User) {
    return this.uploadService.findOne(id, user);
  }

  @Auth()
  @Delete(':id')
  remove(@Param('id') id: string, @CRUser() user: User) {
    return this.uploadService.remove(id, user);
  }
}



/*
Doc
/uploads [POST] - Upload a file


const formData = new FormData();

formData.append('file', fileInput.files[0]); // fileInput is an <input type="file" />

fetch('/api/v1/uploads', {
  method: 'POST',
  body: formData, // formData should contain the file to be uploaded
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));

or post using curl:



curl post file:

curl -X POST -F "file=@/path/to/your/file.jpg" http://localhost:3000/api/v1/uploads?sessionId=your-session-id


/uploads [GET] - Get all uploads with pagination and search

"/api/v1/uploads?page=1&limit=10&search=filename&sortBy=createdAt&sortOrder=desc"

/uploads/:id [GET] - Get a specific upload by ID
'/api/v1/uploads/123'

/uploads/:id [DELETE] - Delete an upload by ID
'/api/v1/uploads/123'

*/
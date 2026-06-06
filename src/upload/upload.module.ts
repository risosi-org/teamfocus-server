import { ServeStaticModule } from '@nestjs/serve-static';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Module } from '@nestjs/common';
import path from 'node:path';

@Module({
  imports: [ServeStaticModule.forRoot({
    rootPath: path.join(__dirname, '..', '..', 'uploads'),
    serveRoot: '/uploads',
  })],
  controllers: [UploadController,],
  providers: [UploadService,],
  exports: []
})
export class UploadModule { }

import { SessionController } from './session.controller';
import { Module } from '@nestjs/common';
import { SessionService } from './session.service';

@Module({
  imports: [],
  controllers: [ SessionController,],
  providers: [SessionService,],
  exports: []
})
export class SessionModule { }

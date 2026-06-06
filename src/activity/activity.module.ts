import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [ActivityController,],
  providers: [ActivityService,],
  exports: []
})
export class ActivityModule { }

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { SyncBatchDto } from './dto/app_session-dto';
import { Auth, CRUser } from '../auth/auth.decorator';
import { User } from '../generated/prisma/client';

@Controller('activites')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) { }
  @Auth("ADMIN","USER")
  @Post('sync-batch')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async syncBatch(@Body() dto: SyncBatchDto, @CRUser() user: User) {
    const totalProcessed = await this.activityService.processBatch(dto.sessions, user);
    return {
      success: true,
      message: `Batch sync complete. Processed ${totalProcessed} records.`
    };
  }
  @Auth()
  @Get('dashboard/today/:userId')
  async getDashboard(@Param('userId') id: string, @CRUser() user: User, @Query('date') dateParam?: string) {
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    return this.activityService.getDashboard(id, user, targetDate);
  }

  @Auth()
  @Get('week/:userId')
  async getWeeklyDashboard(@Param('userId') id :string,  @CRUser() user: User, @Query('date') dateParam?: string,) {
    // If no date is passed, default to today's date
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    
    return await this.activityService.getWeeklyDashboardData(targetDate, id, user);
  }
}

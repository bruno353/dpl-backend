import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { join, extname } from 'path';
import { PrismaService } from '../database/prisma.service';
import { addDays, startOfDay } from 'date-fns';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class JobsCron {
  private logger = new Logger(JobsCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  @Cron('0 0 12 * * *') //runs every day mid day
  async handleCheckUpdateTasks() {
    await this.tasksService.updateTasksData();
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  resumo(@CurrentUser() user: AuthUser, @Query('filialId') filialId?: string) {
    return this.dashboardService.resumo(user, filialId);
  }
}

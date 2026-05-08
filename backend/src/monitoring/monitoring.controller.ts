import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'
import { MonitoringService } from './monitoring.service'

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  async getHealth() {
    return this.monitoringService.getHealth()
  }

  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    const metrics = await this.monitoringService.getMetrics()
    res.setHeader('Content-Type', this.monitoringService.getMetricsContentType())
    res.send(metrics)
  }
}

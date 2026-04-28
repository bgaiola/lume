import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  /**
   * Liveness probe. Kept outside of the v1 prefix so reverse-proxy health
   * checks can hit `/health` without versioning concerns.
   */
  @Get()
  check(): { status: 'ok'; service: 'lume-api'; timestamp: string } {
    return {
      status: 'ok',
      service: 'lume-api',
      timestamp: new Date().toISOString(),
    };
  }
}

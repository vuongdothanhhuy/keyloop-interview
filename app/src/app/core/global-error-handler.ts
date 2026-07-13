import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

// NOT a @Service(): this is provided manually under the ErrorHandler token
// (see app.config.ts), not auto-provided as itself.
@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);

  handleError(error: Error): void {
    this.logger.error(`Uncaught error: ${error.message}`, { stack: error.stack ?? '' });
  }
}

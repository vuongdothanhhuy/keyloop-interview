import { Service, inject } from '@angular/core';
import { ClockService } from './clock.service';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

@Service()
export class LoggerService {
  private readonly clock = inject(ClockService);

  info(message: string, context?: Record<string, unknown>): void {
    this.write('INFO', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('WARN', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('ERROR', message, context);
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const line = `[${this.clock.now().toISOString()}] [${level}] ${message}`;
    const method = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info';
    if (context !== undefined) {
      console[method](line, context);
    } else {
      console[method](line);
    }
  }
}

import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';
import { ClockService } from './clock.service';

describe('LoggerService', () => {
  it('prefixes log messages with an ISO timestamp and level', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ClockService, useValue: { now: () => new Date('2026-07-09T00:00:00.000Z') } }],
    });
    const logger = TestBed.inject(LoggerService);
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    logger.info('vehicles loaded', { count: 130 });

    expect(spy).toHaveBeenCalledWith('[2026-07-09T00:00:00.000Z] [INFO] vehicles loaded', { count: 130 });
    spy.mockRestore();
  });

  it('logs warnings via console.warn with the WARN level tag', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ClockService, useValue: { now: () => new Date('2026-07-09T00:00:00.000Z') } }],
    });
    const logger = TestBed.inject(LoggerService);
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    logger.warn('retrying request', { attempt: 2 });

    expect(spy).toHaveBeenCalledWith('[2026-07-09T00:00:00.000Z] [WARN] retrying request', { attempt: 2 });
    spy.mockRestore();
  });

  it('logs errors via console.error with the ERROR level tag', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ClockService, useValue: { now: () => new Date('2026-07-09T00:00:00.000Z') } }],
    });
    const logger = TestBed.inject(LoggerService);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    logger.error('request failed', { status: 503 });

    expect(spy).toHaveBeenCalledWith('[2026-07-09T00:00:00.000Z] [ERROR] request failed', { status: 503 });
    spy.mockRestore();
  });

  it('omits the context argument entirely when none is provided', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ClockService, useValue: { now: () => new Date('2026-07-09T00:00:00.000Z') } }],
    });
    const logger = TestBed.inject(LoggerService);
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    logger.info('no context here');

    expect(spy).toHaveBeenCalledWith('[2026-07-09T00:00:00.000Z] [INFO] no context here');
    spy.mockRestore();
  });
});

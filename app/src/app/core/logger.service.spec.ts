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
});

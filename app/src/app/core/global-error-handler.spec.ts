import { TestBed } from '@angular/core/testing';
import { AppErrorHandler } from './global-error-handler';
import { LoggerService } from './logger.service';

describe('AppErrorHandler', () => {
  it('logs uncaught errors via LoggerService instead of letting them vanish', () => {
    const errorSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [AppErrorHandler, { provide: LoggerService, useValue: { error: errorSpy } }],
    });
    const handler = TestBed.inject(AppErrorHandler);

    handler.handleError(new Error('boom'));

    expect(errorSpy).toHaveBeenCalledWith('Uncaught error: boom', { stack: expect.any(String) });
  });
});

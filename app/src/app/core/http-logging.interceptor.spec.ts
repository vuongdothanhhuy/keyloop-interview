import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { httpLoggingInterceptor } from './http-logging.interceptor';
import { LoggerService } from './logger.service';

describe('httpLoggingInterceptor', () => {
  it('logs the method, url, and status once the request completes', () =>
    new Promise<void>((resolve) => {
      const infoSpy = vi.fn();
      TestBed.configureTestingModule({
        providers: [{ provide: LoggerService, useValue: { info: infoSpy, error: vi.fn() } }],
      });

      const req = new HttpRequest('GET', '/api/vehicles');
      const next = () => of(new HttpResponse({ status: 200 }));

      TestBed.runInInjectionContext(() => {
        httpLoggingInterceptor(req, next).subscribe(() => {
          expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/vehicles -> 200'));
          resolve();
        });
      });
    }));
});

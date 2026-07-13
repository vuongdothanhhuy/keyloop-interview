import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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

  it('logs the method, url, and error status when the request fails, and still propagates the error', () =>
    new Promise<void>((resolve) => {
      const errorSpy = vi.fn();
      TestBed.configureTestingModule({
        providers: [{ provide: LoggerService, useValue: { info: vi.fn(), error: errorSpy } }],
      });

      const req = new HttpRequest('GET', '/api/vehicles');
      const failure = new HttpErrorResponse({ status: 503, statusText: 'Service Unavailable' });
      const next = () => throwError(() => failure);

      TestBed.runInInjectionContext(() => {
        httpLoggingInterceptor(req, next).subscribe({
          error: (err) => {
            expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('GET /api/vehicles -> 503'));
            expect(err).toBe(failure); // the interceptor must not swallow the error
            resolve();
          },
        });
      });
    }));
});

import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { LoggerService } from './logger.service';

export const httpLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const start = performance.now();

  return next(req).pipe(
    tap((event: HttpEvent<unknown>) => {
      if (event instanceof HttpResponse) {
        const durationMs = Math.round(performance.now() - start);
        logger.info(`${req.method} ${req.urlWithParams} -> ${event.status} (${durationMs}ms)`);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      const durationMs = Math.round(performance.now() - start);
      logger.error(`${req.method} ${req.urlWithParams} -> ${err.status} (${durationMs}ms)`);
      return throwError(() => err);
    }),
  );
};

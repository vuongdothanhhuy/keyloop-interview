import { Service } from '@angular/core';

@Service()
export class ClockService {
  now(): Date {
    return new Date();
  }
}

import { Service, Signal, signal } from '@angular/core';

export interface CurrentUser {
  name: string;
  role: 'manager';
}

/**
 * No real auth system is in scope for this challenge (see System Design Document,
 * "Assumptions" section). This stands in for what would be a real session/IAM lookup,
 * and exists specifically to make the "allow a manager to log an action" requirement's
 * role boundary visible in the code rather than silently ignored.
 */
@Service()
export class CurrentUserService {
  // Typed as the read-only `Signal`, not the inferred `WritableSignal` — consumers must
  // not be able to mutate the mocked identity, matching VehicleStore's pattern of never
  // exposing a writable signal publicly.
  readonly currentUser: Signal<CurrentUser> = signal<CurrentUser>({
    name: 'Alex Manager',
    role: 'manager',
  });
}

import { CurrentUserService } from './current-user.service';

describe('CurrentUserService', () => {
  it('exposes a mocked manager identity (no real auth in this build)', () => {
    const service = new CurrentUserService();
    expect(service.currentUser()).toEqual({ name: 'Alex Manager', role: 'manager' });
  });
});

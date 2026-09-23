import { currentWibTime } from './waktu-wib';

describe('currentWibTime', () => {
  it('menggeser UTC ke WIB', () => {
    expect(currentWibTime(new Date('2026-09-23T01:00:00Z'))).toBe('08:00');
  });

  it('memakai dua digit', () => {
    expect(currentWibTime(new Date('2026-09-23T02:05:00Z'))).toBe('09:05');
  });

  it('berputar setelah tengah malam', () => {
    expect(currentWibTime(new Date('2026-09-23T17:30:00Z'))).toBe('00:30');
  });
});
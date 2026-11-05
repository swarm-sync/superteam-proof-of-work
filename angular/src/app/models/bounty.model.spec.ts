import { daysUntilDeadline, formatReward, isValidStatus } from './bounty.model';

describe('bounty model helpers', () => {
  it('formats rewards as "amount currency"', () => {
    expect(formatReward({ rewardAmount: 2.5, rewardCurrency: 'SOL' })).toBe('2.5 SOL');
    expect(formatReward({ rewardAmount: 800, rewardCurrency: 'USDC' })).toBe('800 USDC');
  });

  it('validates status strings', () => {
    expect(isValidStatus('open')).toBe(true);
    expect(isValidStatus('awarded')).toBe(true);
    expect(isValidStatus('bogus')).toBe(false);
    expect(isValidStatus(undefined)).toBe(false);
  });

  it('counts days until the deadline relative to a fixed "now"', () => {
    const now = new Date('2026-11-05T12:00:00');
    expect(daysUntilDeadline({ deadline: '2026-11-06' }, now)).toBe(1);
    expect(daysUntilDeadline({ deadline: '2026-11-05' }, now)).toBe(0);
    expect(daysUntilDeadline({ deadline: '2026-11-04' }, now)).toBe(-1);
  });
});

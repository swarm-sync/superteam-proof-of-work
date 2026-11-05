import { FormControl } from '@angular/forms';
import { futureDateValidator, positiveAmountValidator } from './bounty.validators';

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

describe('futureDateValidator', () => {
  const validate = futureDateValidator();

  it('accepts a future date', () => {
    expect(validate(new FormControl(isoDate(1)))).toBeNull();
  });

  it('rejects today', () => {
    expect(validate(new FormControl(isoDate(0)))).toEqual({ notFutureDate: true });
  });

  it('rejects a past date', () => {
    expect(validate(new FormControl(isoDate(-5)))).toEqual({ notFutureDate: true });
  });

  it('rejects a non-date string', () => {
    expect(validate(new FormControl('not-a-date'))).toEqual({ invalidDate: true });
  });

  it('lets empty values through (required owns that case)', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});

describe('positiveAmountValidator', () => {
  const validate = positiveAmountValidator();

  it('accepts positive numbers', () => {
    expect(validate(new FormControl(0.5))).toBeNull();
    expect(validate(new FormControl(2500))).toBeNull();
  });

  it('rejects zero and negatives', () => {
    expect(validate(new FormControl(0))).toEqual({ notPositive: true });
    expect(validate(new FormControl(-10))).toEqual({ notPositive: true });
  });

  it('lets empty values through (required owns that case)', () => {
    expect(validate(new FormControl(null))).toBeNull();
    expect(validate(new FormControl(''))).toBeNull();
  });
});

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Rejects dates that are not strictly in the future (today does not count:
 * a bounty must stay open at least until tomorrow).
 */
export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = control.value;
    if (!raw) return null; // `required` owns the empty case
    const picked = new Date(String(raw) + 'T00:00:00');
    if (Number.isNaN(picked.getTime())) return { invalidDate: true };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return picked.getTime() > today.getTime() ? null : { notFutureDate: true };
  };
}

/** Reward must be a finite number greater than zero. */
export function positiveAmountValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return typeof value === 'number' && Number.isFinite(value) && value > 0
      ? null
      : { notPositive: true };
  };
}

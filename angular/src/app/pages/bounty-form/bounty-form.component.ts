import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SKILL_OPTIONS } from '../../models/bounty.model';
import { BountyService } from '../../services/bounty.service';
import { futureDateValidator, positiveAmountValidator } from '../../validators/bounty.validators';

/**
 * "Post a bounty" page: a reactive form with validation.
 * Every rule is also unit-tested (see bounty-form.component.spec.ts).
 */
@Component({
  selector: 'app-bounty-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section aria-labelledby="form-title">
      <h1 id="form-title">Post a bounty</h1>
      <p class="lede">Sponsors post paid work; hunters submit, you pick a winner.</p>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label>
          Title
          <input type="text" formControlName="title" aria-describedby="title-error" />
          @if (title.invalid && (title.touched || submitted)) {
            <span id="title-error" class="error" role="alert">
              @if (title.errors?.['required']) {
                A title is required.
              } @else if (title.errors?.['minlength']) {
                Title needs at least 5 characters.
              }
            </span>
          }
        </label>

        <label>
          Sponsor
          <input type="text" formControlName="sponsor" aria-describedby="sponsor-error" />
          @if (sponsor.invalid && (sponsor.touched || submitted)) {
            <span id="sponsor-error" class="error" role="alert">Sponsor name is required.</span>
          }
        </label>

        <label>
          Description
          <textarea rows="4" formControlName="description" aria-describedby="desc-error"></textarea>
          @if (description.invalid && (description.touched || submitted)) {
            <span id="desc-error" class="error" role="alert">
              Describe the work (at least 20 characters).
            </span>
          }
        </label>

        <div class="row">
          <label>
            Reward amount
            <input type="number" min="0" step="0.01" formControlName="rewardAmount" aria-describedby="reward-error" />
            @if (rewardAmount.invalid && (rewardAmount.touched || submitted)) {
              <span id="reward-error" class="error" role="alert">
                Reward must be more than 0.
              </span>
            }
          </label>
          <label>
            Currency
            <select formControlName="rewardCurrency">
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
            </select>
          </label>
        </div>

        <fieldset>
          <legend>Required skills (pick at least one)</legend>
          @for (skill of skillOptions; track skill) {
            <label class="check">
              <input
                type="checkbox"
                [checked]="form.controls.skills.value.includes(skill)"
                (change)="toggleSkill(skill, $event)"
              />
              {{ skill }}
            </label>
          }
          @if (form.controls.skills.invalid && submitted) {
            <span class="error" role="alert">Pick at least one skill.</span>
          }
        </fieldset>

        <label>
          Deadline
          <input type="date" formControlName="deadline" aria-describedby="deadline-error" />
          @if (deadline.invalid && (deadline.touched || submitted)) {
            <span id="deadline-error" class="error" role="alert">
              @if (deadline.errors?.['required']) {
                A deadline is required.
              } @else if (deadline.errors?.['notFutureDate']) {
                Deadline must be a future date.
              } @else if (deadline.errors?.['invalidDate']) {
                That date is not valid.
              }
            </span>
          }
        </label>

        <button type="submit" [disabled]="form.invalid && submitted && false">
          Post bounty
        </button>
        @if (submitted && form.invalid) {
          <p class="error" role="alert">Please fix the highlighted fields and try again.</p>
        }
      </form>
    </section>
  `,
  styles: [
    `
      .lede {
        color: #475569;
      }
      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 560px;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-weight: 600;
      }
      input,
      textarea,
      select {
        padding: 0.55rem;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font: inherit;
        font-weight: 400;
      }
      input.ng-touched.ng-invalid,
      textarea.ng-touched.ng-invalid {
        border-color: #dc2626;
      }
      .row {
        display: flex;
        gap: 1rem;
      }
      .row label {
        flex: 1;
      }
      fieldset {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
      }
      .check {
        flex-direction: row;
        align-items: center;
        font-weight: 400;
      }
      .error {
        color: #dc2626;
        font-size: 0.9rem;
        font-weight: 400;
      }
      button[type='submit'] {
        align-self: flex-start;
        padding: 0.6rem 1.25rem;
        border-radius: 8px;
        border: 1px solid #0f172a;
        background: #0f172a;
        color: #fff;
        cursor: pointer;
        font: inherit;
      }
    `,
  ],
})
export class BountyFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(BountyService);
  private readonly router = inject(Router);

  protected readonly skillOptions = SKILL_OPTIONS;
  protected submitted = false;

  protected readonly form = this.fb.group({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)],
    }),
    sponsor: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(20)],
    }),
    rewardAmount: new FormControl<number | null>(null, {
      validators: [Validators.required, positiveAmountValidator()],
    }),
    rewardCurrency: new FormControl<'SOL' | 'USDC'>('USDC', { nonNullable: true }),
    skills: new FormControl<string[]>([], {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1)],
    }),
    deadline: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, futureDateValidator()],
    }),
  });

  protected get title() {
    return this.form.controls.title;
  }
  protected get sponsor() {
    return this.form.controls.sponsor;
  }
  protected get description() {
    return this.form.controls.description;
  }
  protected get rewardAmount() {
    return this.form.controls.rewardAmount;
  }
  protected get deadline() {
    return this.form.controls.deadline;
  }

  protected toggleSkill(skill: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.controls.skills.value;
    this.form.controls.skills.setValue(
      checked ? [...current, skill] : current.filter((s) => s !== skill),
    );
    this.form.controls.skills.markAsTouched();
  }

  protected submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const created = this.service.create({
      title: value.title.trim(),
      sponsor: value.sponsor.trim(),
      description: value.description.trim(),
      rewardAmount: value.rewardAmount ?? 0,
      rewardCurrency: value.rewardCurrency,
      skills: value.skills,
      deadline: value.deadline,
    });
    void this.router.navigate(['/bounties', created.id]);
  }
}

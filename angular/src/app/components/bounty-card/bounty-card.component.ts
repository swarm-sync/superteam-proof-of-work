import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Bounty, daysUntilDeadline, formatReward } from '../../models/bounty.model';

/**
 * Small reusable card for one bounty: reward, status, skills, deadline.
 * Used by the dashboard (top open bounties) and the list page.
 */
@Component({
  selector: 'app-bounty-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="card">
      <header>
        <h3>
          <a [routerLink]="['/bounties', bounty().id]">{{ bounty().title }}</a>
        </h3>
        <span class="status status-{{ bounty().status }}">{{ statusLabel() }}</span>
      </header>
      <p class="sponsor">by {{ bounty().sponsor }}</p>
      <p class="desc">{{ bounty().description }}</p>
      <div class="meta">
        <strong>{{ reward() }}</strong>
        <span>{{ bounty().submissions }} submission{{ bounty().submissions === 1 ? '' : 's' }}</span>
        <span [class.overdue]="daysLeft() < 0">
          {{ daysLeft() < 0 ? 'overdue' : daysLeft() + 'd left' }}
        </span>
      </div>
      <ul class="skills" aria-label="Required skills">
        @for (skill of bounty().skills; track skill) {
          <li>{{ skill }}</li>
        }
      </ul>
    </article>
  `,
  styles: [
    `
      .card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        background: #fff;
      }
      header {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: flex-start;
      }
      h3 {
        margin: 0;
        font-size: 1.05rem;
      }
      h3 a {
        color: #0f172a;
        text-decoration: none;
      }
      h3 a:hover {
        text-decoration: underline;
      }
      .sponsor {
        color: #64748b;
        margin: 0.25rem 0 0.5rem;
      }
      .desc {
        margin: 0 0 0.75rem;
        color: #334155;
      }
      .meta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        font-size: 0.9rem;
      }
      .overdue {
        color: #dc2626;
        font-weight: 600;
      }
      .skills {
        list-style: none;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        padding: 0;
        margin: 0.75rem 0 0;
      }
      .skills li {
        background: #f1f5f9;
        border-radius: 999px;
        padding: 0.15rem 0.6rem;
        font-size: 0.8rem;
      }
      .status {
        border-radius: 999px;
        padding: 0.15rem 0.6rem;
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
      }
      .status-open {
        background: #dcfce7;
        color: #166534;
      }
      .status-in-review {
        background: #fef9c3;
        color: #854d0e;
      }
      .status-awarded {
        background: #dbeafe;
        color: #1e40af;
      }
      .status-closed {
        background: #f1f5f9;
        color: #475569;
      }
    `,
  ],
})
export class BountyCardComponent {
  bounty = input.required<Bounty>();

  protected statusLabel(): string {
    return (
      { open: 'Open', 'in-review': 'In Review', awarded: 'Awarded', closed: 'Closed' } as const
    )[this.bounty().status];
  }

  protected reward(): string {
    return formatReward(this.bounty());
  }

  protected daysLeft(): number {
    return daysUntilDeadline(this.bounty());
  }
}

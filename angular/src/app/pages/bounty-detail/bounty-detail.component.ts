import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Bounty, daysUntilDeadline } from '../../models/bounty.model';
import { BountyService } from '../../services/bounty.service';

/** Detail page for one bounty: full description + status actions. */
@Component({
  selector: 'app-bounty-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section aria-labelledby="detail-title">
      @if (bounty(); as b) {
        <p><a routerLink="/bounties">← All bounties</a></p>
        <h1 id="detail-title">{{ b.title }}</h1>
        <p class="sponsor">Posted by {{ b.sponsor }} · {{ b.createdAt }}</p>
        <dl class="facts">
          <div>
            <dt>Reward</dt>
            <dd>{{ service.rewardLabel(b) }}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{{ service.statusLabel(b.status) }}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>
              {{ b.deadline }}
              ({{ daysLeft(b) < 0 ? 'overdue' : daysLeft(b) + ' days left' }})
            </dd>
          </div>
          <div>
            <dt>Submissions</dt>
            <dd>{{ b.submissions }}</dd>
          </div>
          <div>
            <dt>Skills</dt>
            <dd>{{ b.skills.join(', ') }}</dd>
          </div>
        </dl>
        <h2>About this bounty</h2>
        <p>{{ b.description }}</p>
        <div class="actions">
          @if (b.status === 'open') {
            <button type="button" (click)="setStatus('in-review')">Move to review</button>
          }
          @if (b.status === 'in-review') {
            <button type="button" (click)="setStatus('awarded')">Mark awarded</button>
          }
          @if (b.status !== 'closed') {
            <button type="button" (click)="setStatus('closed')">Close bounty</button>
          }
        </div>
      } @else {
        <h1 id="detail-title">Bounty not found</h1>
        <p>No bounty matches this link. It may have been deleted.</p>
        <p><a routerLink="/bounties">Back to all bounties →</a></p>
      }
    </section>
  `,
  styles: [
    `
      .sponsor {
        color: #64748b;
      }
      .facts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0.75rem;
      }
      .facts div {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 0.75rem 1rem;
        background: #fff;
      }
      .facts dt {
        font-size: 0.85rem;
        color: #64748b;
      }
      .facts dd {
        margin: 0.25rem 0 0;
        font-weight: 600;
      }
      .actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
      button {
        padding: 0.6rem 1rem;
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
export class BountyDetailComponent implements OnInit {
  protected readonly service = inject(BountyService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly bounty = signal<Bounty | undefined>(undefined);

  ngOnInit(): void {
    this.service.load().subscribe(() => {
      const id = this.route.snapshot.paramMap.get('id') ?? '';
      this.bounty.set(this.service.byId(id));
    });
  }

  protected daysLeft(bounty: Bounty): number {
    return daysUntilDeadline(bounty);
  }

  protected setStatus(status: Bounty['status']): void {
    const current = this.bounty();
    if (!current) return;
    this.service.updateStatus(current.id, status);
    this.bounty.set(this.service.byId(current.id));
    if (status === 'closed') void this.router.navigate(['/bounties']);
  }
}

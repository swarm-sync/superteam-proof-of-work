import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BountyCardComponent } from '../../components/bounty-card/bounty-card.component';
import { BountyService } from '../../services/bounty.service';

/** Home page: headline stats (signals) + the soonest-closing open bounties. */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, BountyCardComponent],
  template: `
    <section aria-labelledby="dash-title">
      <h1 id="dash-title">Bounty dashboard</h1>
      <p class="lede">Open work, rewards on the table, and what needs a decision next.</p>

      @if (service.loading()) {
        <p role="status">Loading bounties…</p>
      } @else if (service.loadError()) {
        <p role="alert" class="error">{{ service.loadError() }}</p>
      } @else {
        <dl class="stats">
          <div>
            <dt>Total bounties</dt>
            <dd>{{ service.stats().total }}</dd>
          </div>
          <div>
            <dt>Open now</dt>
            <dd>{{ service.stats().open }}</dd>
          </div>
          <div>
            <dt>In review</dt>
            <dd>{{ service.stats().inReview }}</dd>
          </div>
          <div>
            <dt>Awarded</dt>
            <dd>{{ service.stats().awarded }}</dd>
          </div>
          <div>
            <dt>Open rewards (≈ USD)</dt>
            <dd>\${{ service.stats().totalOpenRewardsUsd.toLocaleString() }}</dd>
          </div>
          <div>
            <dt>Avg. submissions</dt>
            <dd>{{ service.stats().avgSubmissions }}</dd>
          </div>
        </dl>

        <h2>Closing soonest</h2>
        <div class="grid">
          @for (bounty of closingSoonest(); track bounty.id) {
            <app-bounty-card [bounty]="bounty" />
          } @empty {
            <p>No open bounties right now.</p>
          }
        </div>
        <p><a routerLink="/bounties">See all bounties →</a></p>
      }
    </section>
  `,
  styles: [
    `
      .lede {
        color: #475569;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 0.75rem;
        margin: 1rem 0 2rem;
      }
      .stats div {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 0.75rem 1rem;
        background: #fff;
      }
      .stats dt {
        font-size: 0.85rem;
        color: #64748b;
      }
      .stats dd {
        margin: 0.25rem 0 0;
        font-size: 1.5rem;
        font-weight: 700;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }
      .error {
        color: #dc2626;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  protected readonly service = inject(BountyService);

  ngOnInit(): void {
    this.service.load().subscribe();
  }

  /** Open bounties sorted by nearest deadline, at most 3. */
  protected closingSoonest() {
    return this.service
      .openBounties()
      .slice()
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 3);
  }
}

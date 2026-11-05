import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BountyCardComponent } from '../../components/bounty-card/bounty-card.component';
import { BOUNTY_STATUSES, BountyStatus, STATUS_LABELS } from '../../models/bounty.model';
import { BountyService } from '../../services/bounty.service';

/** Browse page: filter by status, free-text search, delete a bounty. */
@Component({
  selector: 'app-bounty-list',
  standalone: true,
  imports: [FormsModule, RouterLink, BountyCardComponent],
  template: `
    <section aria-labelledby="list-title">
      <h1 id="list-title">All bounties</h1>

      <form class="filters" (submit)="$event.preventDefault()">
        <label>
          Status
          <select
            [ngModel]="statusFilter()"
            (ngModelChange)="statusFilter.set($event)"
            [ngModelOptions]="{ standalone: true }"
          >
            <option value="all">All statuses</option>
            @for (status of statuses; track status) {
              <option [value]="status">{{ statusLabels[status] }}</option>
            }
          </select>
        </label>
        <label>
          Search
          <input
            type="search"
            placeholder="Title, sponsor, or skill…"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            [ngModelOptions]="{ standalone: true }"
            aria-label="Search bounties"
          />
        </label>
      </form>

      @if (service.loading()) {
        <p role="status">Loading bounties…</p>
      } @else if (service.loadError()) {
        <p role="alert" class="error">{{ service.loadError() }}</p>
      } @else {
        <p role="status">{{ visible().length }} bounty{{ visible().length === 1 ? '' : 'ies' }} found.</p>
        <div class="grid">
          @for (bounty of visible(); track bounty.id) {
            <div class="item">
              <app-bounty-card [bounty]="bounty" />
              <button type="button" class="danger" (click)="remove(bounty.id, bounty.title)">
                Delete
              </button>
            </div>
          } @empty {
            <p>No bounties match these filters. <a routerLink="/new">Post one →</a></p>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .filters {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin: 1rem 0;
      }
      .filters label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-weight: 600;
        font-size: 0.9rem;
      }
      .filters input,
      .filters select {
        padding: 0.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font: inherit;
        min-width: 220px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }
      .item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .item app-bounty-card {
        flex: 1;
      }
      .danger {
        align-self: flex-start;
        background: none;
        border: 1px solid #fecaca;
        color: #dc2626;
        border-radius: 8px;
        padding: 0.35rem 0.75rem;
        cursor: pointer;
      }
      .danger:hover {
        background: #fef2f2;
      }
      .error {
        color: #dc2626;
      }
    `,
  ],
})
export class BountyListComponent implements OnInit {
  protected readonly service = inject(BountyService);
  protected readonly statusFilter = signal<BountyStatus | 'all'>('all');
  protected readonly query = signal('');
  protected readonly statuses = BOUNTY_STATUSES;
  protected readonly statusLabels = STATUS_LABELS;

  ngOnInit(): void {
    this.service.load().subscribe();
  }

  protected visible() {
    return this.service.filter(this.statusFilter(), this.query());
  }

  protected remove(id: string, title: string): void {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      this.service.remove(id);
    }
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
  Bounty,
  BountyStatus,
  STATUS_LABELS,
  formatReward,
} from '../models/bounty.model';

export interface BountyInput {
  title: string;
  sponsor: string;
  description: string;
  rewardAmount: number;
  rewardCurrency: 'SOL' | 'USDC';
  skills: string[];
  deadline: string;
}

export interface DashboardStats {
  total: number;
  open: number;
  inReview: number;
  awarded: number;
  totalOpenRewardsUsd: number;
  avgSubmissions: number;
}

/** Rough SOL price used only for the dashboard's indicative USD total. */
const SOL_USD = 180;

const STORAGE_KEY = 'bounty-tracker.bounties.v1';

/**
 * Bounty data service.
 *
 * The seed list is fetched with HttpClient from the local mock API
 * (`public/mock-bounties.json`, served by `ng serve` / the production build
 * as a static asset). After the first load, creates/updates/deletes are kept
 * in a signal-backed store persisted to localStorage, so the tracker works
 * fully offline and survives reloads. The mock API intentionally has no
 * write endpoints — the service is explicit about that boundary.
 */
@Injectable({ providedIn: 'root' })
export class BountyService {
  private readonly http = inject(HttpClient);

  /** All bounties, newest first. The single source of truth for the UI. */
  readonly bounties = signal<Bounty[]>([]);

  /** True while the seed list is being fetched. */
  readonly loading = signal(false);

  /** Human-readable load error, or null. */
  readonly loadError = signal<string | null>(null);

  readonly openBounties = computed(() =>
    this.bounties().filter((b) => b.status === 'open'),
  );

  readonly stats = computed<DashboardStats>(() => {
    const all = this.bounties();
    const open = all.filter((b) => b.status === 'open');
    const totalRewardsUsd = open.reduce(
      (sum, b) => sum + (b.rewardCurrency === 'SOL' ? b.rewardAmount * SOL_USD : b.rewardAmount),
      0,
    );
    return {
      total: all.length,
      open: open.length,
      inReview: all.filter((b) => b.status === 'in-review').length,
      awarded: all.filter((b) => b.status === 'awarded').length,
      totalOpenRewardsUsd: Math.round(totalRewardsUsd),
      avgSubmissions: all.length
        ? Math.round((all.reduce((s, b) => s + b.submissions, 0) / all.length) * 10) / 10
        : 0,
    };
  });

  /**
   * Loads the seed list once. Prefers a previously saved local copy
   * (user edits survive reloads); otherwise fetches the mock API.
   */
  load(): Observable<Bounty[]> {
    if (this.bounties().length > 0) return of(this.bounties());
    const saved = this.readFromStorage();
    if (saved) {
      this.bounties.set(saved);
      return of(saved);
    }
    this.loading.set(true);
    this.loadError.set(null);
    return this.http.get<Bounty[]>('mock-bounties.json').pipe(
      map((list) => [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
      tap((list) => {
        this.bounties.set(list);
        this.writeToStorage(list);
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        this.loading.set(false);
        this.loadError.set('Could not load bounties from the mock API. Check that the dev server is running.');
        console.error('BountyService.load failed', err);
        return of([]);
      }),
    );
  }

  byId(id: string): Bounty | undefined {
    return this.bounties().find((b) => b.id === id);
  }

  filter(status: BountyStatus | 'all', query: string): Bounty[] {
    const needle = query.trim().toLowerCase();
    return this.bounties().filter((b) => {
      const statusOk = status === 'all' || b.status === status;
      const queryOk =
        !needle ||
        b.title.toLowerCase().includes(needle) ||
        b.sponsor.toLowerCase().includes(needle) ||
        b.skills.some((s) => s.toLowerCase().includes(needle));
      return statusOk && queryOk;
    });
  }

  create(input: BountyInput): Bounty {
    const now = new Date().toISOString().slice(0, 10);
    const bounty: Bounty = {
      ...input,
      id: `b-${Date.now().toString(36)}`,
      status: 'open',
      submissions: 0,
      createdAt: now,
    };
    const next = [bounty, ...this.bounties()];
    this.bounties.set(next);
    this.writeToStorage(next);
    return bounty;
  }

  updateStatus(id: string, status: BountyStatus): boolean {
    const next = this.bounties().map((b) => (b.id === id ? { ...b, status } : b));
    if (next.every((b, i) => b === this.bounties()[i])) return false;
    this.bounties.set(next);
    this.writeToStorage(next);
    return true;
  }

  remove(id: string): boolean {
    const next = this.bounties().filter((b) => b.id !== id);
    if (next.length === this.bounties().length) return false;
    this.bounties.set(next);
    this.writeToStorage(next);
    return true;
  }

  statusLabel(status: BountyStatus): string {
    return STATUS_LABELS[status];
  }

  rewardLabel(bounty: Bounty): string {
    return formatReward(bounty);
  }

  private readFromStorage(): Bounty[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Bounty[]) : null;
    } catch {
      return null;
    }
  }

  private writeToStorage(list: Bounty[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Storage full / private mode: the in-memory signal still works.
    }
  }
}

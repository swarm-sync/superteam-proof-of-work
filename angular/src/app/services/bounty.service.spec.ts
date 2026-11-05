import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Bounty } from '../models/bounty.model';
import { BountyService } from './bounty.service';

const SEED: Bounty[] = [
  {
    id: 'b-1',
    title: 'Build a staking dashboard',
    sponsor: 'Solana Foundation',
    description: 'Dashboard work',
    rewardAmount: 2,
    rewardCurrency: 'SOL',
    status: 'open',
    skills: ['React', 'Solana'],
    submissions: 5,
    deadline: '2026-12-15',
    createdAt: '2026-11-01',
  },
  {
    id: 'b-2',
    title: 'Indexer API',
    sponsor: 'Helius',
    description: 'API work',
    rewardAmount: 1000,
    rewardCurrency: 'USDC',
    status: 'in-review',
    skills: ['Node.js'],
    submissions: 3,
    deadline: '2026-11-20',
    createdAt: '2026-10-20',
  },
  {
    id: 'b-3',
    title: 'Brand refresh',
    sponsor: 'Superteam',
    description: 'Design work',
    rewardAmount: 500,
    rewardCurrency: 'USDC',
    status: 'awarded',
    skills: ['Graphic Design'],
    submissions: 10,
    deadline: '2026-10-30',
    createdAt: '2026-10-05',
  },
];

describe('BountyService', () => {
  let service: BountyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BountyService],
    });
    service = TestBed.inject(BountyService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('loads the seed list from the mock API via HttpClient, newest first', (done) => {
    service.load().subscribe((list) => {
      expect(list.map((b) => b.id)).toEqual(['b-1', 'b-2', 'b-3']);
      expect(service.bounties().length).toBe(3);
      done();
    });
    const req = httpMock.expectOne('mock-bounties.json');
    expect(req.request.method).toBe('GET');
    req.flush([...SEED].reverse());
  });

  it('derives dashboard stats from the signal', (done) => {
    service.load().subscribe(() => {
      const stats = service.stats();
      expect(stats.total).toBe(3);
      expect(stats.open).toBe(1);
      expect(stats.inReview).toBe(1);
      expect(stats.awarded).toBe(1);
      // 2 SOL * $180 = $360 of open rewards.
      expect(stats.totalOpenRewardsUsd).toBe(360);
      expect(stats.avgSubmissions).toBe(6);
      done();
    });
    httpMock.expectOne('mock-bounties.json').flush(SEED);
  });

  it('filters by status and by title/sponsor/skill query', (done) => {
    service.load().subscribe(() => {
      expect(service.filter('open', '').map((b) => b.id)).toEqual(['b-1']);
      expect(service.filter('all', 'helius').map((b) => b.id)).toEqual(['b-2']);
      expect(service.filter('all', 'solana').map((b) => b.id)).toEqual(['b-1']);
      expect(service.filter('closed', '')).toEqual([]);
      done();
    });
    httpMock.expectOne('mock-bounties.json').flush(SEED);
  });

  it('creates a bounty at the top of the list as open with zero submissions', (done) => {
    service.load().subscribe(() => {
      const created = service.create({
        title: 'New bounty',
        sponsor: 'Jupiter',
        description: 'Some work',
        rewardAmount: 100,
        rewardCurrency: 'USDC',
        skills: ['Rust'],
        deadline: '2026-12-31',
      });
      expect(created.status).toBe('open');
      expect(created.submissions).toBe(0);
      expect(service.bounties()[0].id).toBe(created.id);
      expect(service.bounties().length).toBe(4);
      done();
    });
    httpMock.expectOne('mock-bounties.json').flush(SEED);
  });

  it('updates status and removes by id; unknown ids return false', (done) => {
    service.load().subscribe(() => {
      expect(service.updateStatus('b-1', 'awarded')).toBe(true);
      expect(service.byId('b-1')?.status).toBe('awarded');
      expect(service.updateStatus('nope', 'closed')).toBe(false);
      expect(service.remove('b-2')).toBe(true);
      expect(service.byId('b-2')).toBeUndefined();
      expect(service.remove('b-2')).toBe(false);
      done();
    });
    httpMock.expectOne('mock-bounties.json').flush(SEED);
  });

  it('sets loadError and stays usable when the mock API fails', (done) => {
    service.load().subscribe((list) => {
      expect(list).toEqual([]);
      expect(service.loadError()).toContain('mock API');
      done();
    });
    httpMock.expectOne('mock-bounties.json').error(new ProgressEvent('error'));
  });
});

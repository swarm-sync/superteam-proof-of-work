import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Dashboard | Bounty Tracker',
  },
  {
    path: 'bounties',
    loadComponent: () =>
      import('./pages/bounty-list/bounty-list.component').then((m) => m.BountyListComponent),
    title: 'All bounties | Bounty Tracker',
  },
  {
    path: 'bounties/:id',
    loadComponent: () =>
      import('./pages/bounty-detail/bounty-detail.component').then((m) => m.BountyDetailComponent),
    title: 'Bounty | Bounty Tracker',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/bounty-form/bounty-form.component').then((m) => m.BountyFormComponent),
    title: 'Post a bounty | Bounty Tracker',
  },
  { path: '**', redirectTo: '' },
];

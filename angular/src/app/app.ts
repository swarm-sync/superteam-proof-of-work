import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header>
      <nav aria-label="Main">
        <a routerLink="/" class="brand">Bounty Tracker</a>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          Dashboard
        </a>
        <a routerLink="/bounties" routerLinkActive="active">Bounties</a>
        <a routerLink="/new" routerLinkActive="active">Post a bounty</a>
      </nav>
    </header>
    <main>
      <router-outlet />
    </main>
    <footer>
      <p>Demo data served from a local mock API (<code>mock-bounties.json</code>). Your edits are saved in your browser only.</p>
    </footer>
  `,
  styles: [
    `
      header {
        background: #0f172a;
      }
      nav {
        max-width: 960px;
        margin: 0 auto;
        display: flex;
        gap: 1.25rem;
        align-items: center;
        padding: 0.9rem 1rem;
      }
      nav a {
        color: #cbd5e1;
        text-decoration: none;
      }
      nav a.brand {
        color: #fff;
        font-weight: 700;
        font-size: 1.1rem;
        margin-right: auto;
      }
      nav a.active {
        color: #fff;
        text-decoration: underline;
      }
      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 1.5rem 1rem 3rem;
      }
      footer {
        max-width: 960px;
        margin: 0 auto;
        padding: 0 1rem 2rem;
        color: #64748b;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class App {}

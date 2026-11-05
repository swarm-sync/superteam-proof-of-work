# Bounty Board — Laravel CRUD app

A small bounty-board app built with Laravel 11 (PHP 8.2+): browse, search
and filter bounty listings, post a new bounty, edit and delete it. Listings
belong to categories and carry a reward, status, deadline and sponsor.

## What it demonstrates

- **Eloquent models** with relationships, casts, query scopes and a
  domain method (`Bounty::scopeActive`, `Bounty::isOpen`)
- **Migrations** with foreign keys, indexes and defaults
- **Form-request validation** (`StoreBountyRequest` / `UpdateBountyRequest`):
  required fields, value ranges, status allow-list, future deadlines,
  existing category, valid sponsor email
- **Blade views** — layout, index with search/category/status filters and
  pagination, show, create/edit sharing one form partial, flash messages
  and validation-error display
- **Seeders + factories** — 5 categories, 4 realistic sample bounties,
  8 generated ones
- **Feature tests** — 9 tests covering list/filter/search, show, create
  (valid + invalid + unknown category), update, delete and the active scope,
  running against in-memory SQLite

## Contents

| Path | What it is |
|---|---|
| `app/Models/Bounty.php`, `Category.php` | Eloquent models |
| `app/Http/Controllers/BountyController.php` | Resource controller (index/show/create/store/edit/update/destroy) |
| `app/Http/Requests/` | Form-request validation |
| `database/migrations/` | `categories` + `bounties` tables |
| `database/factories/`, `database/seeders/` | Factories + `DatabaseSeeder` |
| `resources/views/` | Blade layout + bounty views |
| `routes/web.php` | `Route::resource('bounties', ...)` |
| `tests/Feature/BountyTest.php` | 9 feature tests |
| `composer.json`, `phpunit.xml`, `.env.example` | Project wiring |

## Install / run / test

Prerequisites: PHP 8.2+, Composer, SQLite extension.

```bash
cd laravel
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve          # http://localhost:8000
php artisan test           # 9 feature tests, in-memory SQLite
```

## Verification status (2026-11-05, this VM)

**NOT verified by running it here.** This VM has no PHP or Composer
installed (`php: command not found`, `composer: command not found`), and
`apt-get install php-cli …` could not run because another process held the
apt lock for the whole session (a sibling agent's `apt-get update`, PID 3647,
still running at last check). No PHP binary exists anywhere on the machine
and there is no Docker to run PHP in. The source is complete and written to
Laravel 11 conventions, but `composer install`, `migrate --seed`,
`php artisan test` and `php artisan serve` have **not** been run — run the
commands above on a machine with PHP 8.2+ and Composer to verify. Do not
treat this artifact as run-verified until those commands pass.

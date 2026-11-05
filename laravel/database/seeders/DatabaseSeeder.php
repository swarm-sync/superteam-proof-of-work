<?php

namespace Database\Seeders;

use App\Models\Bounty;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $categories = collect(['Development', 'Design', 'Content', 'Research', 'Marketing'])
            ->map(fn (string $name) => Category::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name],
            ));

        $samples = [
            ['Build a Solana validator dashboard', 'Development', 800, 'A real-time dashboard showing validator uptime, stake and skip rate, with a one-command local run.'],
            ['Write a Solana cookbook chapter', 'Content', 250, 'A beginner-friendly chapter on reading on-chain account data with web3.js, with runnable examples.'],
            ['Audit a staking program', 'Research', 1500, 'Review the staking program for authority and accounting issues and report findings with severity ratings.'],
            ['Design the bounty landing page', 'Design', 400, 'A clean, accessible landing page for the bounty board, delivered as Figma plus responsive HTML.'],
        ];

        foreach ($samples as [$title, $category, $reward, $description]) {
            Bounty::factory()->create([
                'title' => $title,
                'description' => $description,
                'reward_usd' => $reward,
                'currency' => 'USD',
                'status' => 'open',
                'deadline' => now()->addDays(30)->toDateString(),
                'category_id' => $categories->firstWhere('name', $category)->id,
                'sponsor_name' => 'Superteam Demo',
                'sponsor_email' => 'demo@example.com',
            ]);
        }

        Bounty::factory(8)->create();
    }
}

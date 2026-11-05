<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Bounty> */
class BountyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'title' => $this->faker->sentence(5),
            'description' => $this->faker->paragraphs(2, true),
            'reward_usd' => $this->faker->randomFloat(2, 50, 5000),
            'currency' => $this->faker->randomElement(['USD', 'USDC', 'SOL']),
            'status' => $this->faker->randomElement(['open', 'open', 'open', 'in_review', 'closed']),
            'deadline' => $this->faker->optional()->dateTimeBetween('now', '+60 days'),
            'sponsor_name' => $this->faker->company(),
            'sponsor_email' => $this->faker->companyEmail(),
        ];
    }

    public function open(): static
    {
        return $this->state(fn () => ['status' => 'open', 'deadline' => now()->addDays(14)->toDateString()]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Bounty;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BountyTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        $category = Category::factory()->create();

        return array_merge([
            'title' => 'Build a Solana validator dashboard',
            'description' => 'A real-time dashboard showing validator uptime, stake and skip rate.',
            'reward_usd' => 800,
            'currency' => 'USD',
            'status' => 'open',
            'deadline' => now()->addDays(14)->toDateString(),
            'category_id' => $category->id,
            'sponsor_name' => 'Superteam Demo',
            'sponsor_email' => 'demo@example.com',
        ], $overrides);
    }

    public function test_index_lists_bounties_and_filters_by_category(): void
    {
        $a = Category::factory()->create(['name' => 'Development']);
        $b = Category::factory()->create(['name' => 'Design']);
        Bounty::factory()->create(['title' => 'Dev bounty', 'category_id' => $a->id]);
        Bounty::factory()->create(['title' => 'Design bounty', 'category_id' => $b->id]);

        $this->get(route('bounties.index'))
            ->assertOk()
            ->assertSee('Dev bounty')
            ->assertSee('Design bounty');

        $this->get(route('bounties.index', ['category' => $a->id]))
            ->assertOk()
            ->assertSee('Dev bounty')
            ->assertDontSee('Design bounty');
    }

    public function test_index_searches_title_and_description(): void
    {
        Bounty::factory()->create(['title' => 'Validator dashboard']);
        Bounty::factory()->create(['title' => 'Cookbook chapter']);

        $this->get(route('bounties.index', ['q' => 'validator']))
            ->assertOk()
            ->assertSee('Validator dashboard')
            ->assertDontSee('Cookbook chapter');
    }

    public function test_show_displays_a_bounty(): void
    {
        $bounty = Bounty::factory()->open()->create(['title' => 'Audit a staking program']);

        $this->get(route('bounties.show', $bounty))
            ->assertOk()
            ->assertSee('Audit a staking program')
            ->assertSee('$');
    }

    public function test_store_creates_a_bounty_and_redirects(): void
    {
        $response = $this->post(route('bounties.store'), $this->payload());

        $response->assertRedirect();
        $this->assertDatabaseHas('bounties', ['title' => 'Build a Solana validator dashboard']);
        $this->assertEquals(1, Bounty::count());
    }

    public function test_store_rejects_invalid_data(): void
    {
        $response = $this->post(route('bounties.store'), $this->payload([
            'title' => 'x',            // too short
            'reward_usd' => 0,         // below minimum
            'status' => 'bogus',       // not in Bounty::STATUSES
            'sponsor_email' => 'nope', // not an email
            'deadline' => now()->subDay()->toDateString(), // in the past
        ]));

        $response->assertSessionHasErrors(['title', 'reward_usd', 'status', 'sponsor_email', 'deadline']);
        $this->assertEquals(0, Bounty::count());
    }

    public function test_store_rejects_unknown_category(): void
    {
        $response = $this->post(route('bounties.store'), $this->payload(['category_id' => 999999]));

        $response->assertSessionHasErrors('category_id');
        $this->assertEquals(0, Bounty::count());
    }

    public function test_update_changes_a_bounty(): void
    {
        $bounty = Bounty::factory()->create();

        $this->put(route('bounties.update', $bounty), $this->payload([
            'title' => 'Updated bounty title',
            'category_id' => $bounty->category_id,
        ]))->assertRedirect(route('bounties.show', $bounty));

        $this->assertDatabaseHas('bounties', ['id' => $bounty->id, 'title' => 'Updated bounty title']);
    }

    public function test_destroy_deletes_a_bounty(): void
    {
        $bounty = Bounty::factory()->create();

        $this->delete(route('bounties.destroy', $bounty))
            ->assertRedirect(route('bounties.index'));

        $this->assertDatabaseMissing('bounties', ['id' => $bounty->id]);
    }

    public function test_active_scope_excludes_closed_and_expired_bounties(): void
    {
        $open = Bounty::factory()->open()->create();
        Bounty::factory()->create(['status' => 'closed']);
        Bounty::factory()->create(['status' => 'open', 'deadline' => now()->subDay()->toDateString()]);

        $this->assertEquals([$open->id], Bounty::active()->pluck('id')->all());
        $this->assertTrue($open->isOpen());
    }
}

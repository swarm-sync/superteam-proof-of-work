<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bounties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('title', 120);
            $table->text('description');
            $table->decimal('reward_usd', 12, 2);
            $table->string('currency', 4)->default('USD');
            $table->string('status', 20)->default('open');
            $table->date('deadline')->nullable();
            $table->string('sponsor_name', 80);
            $table->string('sponsor_email');
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('deadline');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bounties');
    }
};

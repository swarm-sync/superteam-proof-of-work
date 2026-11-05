<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bounty extends Model
{
    use HasFactory;

    public const STATUSES = ['open', 'in_review', 'closed'];

    protected $fillable = [
        'title',
        'description',
        'reward_usd',
        'currency',
        'status',
        'deadline',
        'category_id',
        'sponsor_name',
        'sponsor_email',
    ];

    protected $casts = [
        'reward_usd' => 'decimal:2',
        'deadline' => 'date',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** Only open bounties whose deadline has not passed. */
    public function scopeActive($query)
    {
        return $query->where('status', 'open')
            ->where(fn ($q) => $q->whereNull('deadline')->orWhere('deadline', '>=', now()->toDateString()));
    }

    public function scopeForCategory($query, ?int $categoryId)
    {
        return $categoryId ? $query->where('category_id', $categoryId) : $query;
    }

    public function isOpen(): bool
    {
        return $this->status === 'open'
            && ($this->deadline === null || $this->deadline->isFuture() || $this->deadline->isToday());
    }
}

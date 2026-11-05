@extends('layouts.app')

@section('title', $bounty->title . ' — Bounty Board')

@section('content')
<article class="card">
    <h2>{{ $bounty->title }}</h2>
    <p class="muted">
        {{ $bounty->category?->name ?? 'Uncategorized' }} ·
        {{ ucfirst(str_replace('_', ' ', $bounty->status)) }} ·
        @if ($bounty->deadline) deadline {{ $bounty->deadline->format('M j, Y') }} · @endif
        posted {{ $bounty->created_at->format('M j, Y') }}
    </p>
    <p><strong>Reward: ${{ number_format($bounty->reward_usd, 2) }} {{ $bounty->currency }}</strong></p>
    <p>{{ $bounty->description }}</p>
    <p class="muted">Sponsor: {{ $bounty->sponsor_name }} ({{ $bounty->sponsor_email }})</p>
    <p>
        <a href="{{ route('bounties.edit', $bounty) }}">Edit</a>
        <form method="POST" action="{{ route('bounties.destroy', $bounty) }}" style="display:inline" onsubmit="return confirm('Delete this bounty?');">
            @csrf
            @method('DELETE')
            <button type="submit">Delete</button>
        </form>
    </p>
</article>
<p><a href="{{ route('bounties.index') }}">&larr; Back to all bounties</a></p>
@endsection

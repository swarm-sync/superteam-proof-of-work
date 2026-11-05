@extends('layouts.app')

@section('title', 'All bounties — Bounty Board')

@section('content')
<form method="GET" action="{{ route('bounties.index') }}" class="filters" role="search">
    <div>
        <label for="q">Search</label>
        <input id="q" type="search" name="q" value="{{ request('q') }}" placeholder="e.g. validator">
    </div>
    <div>
        <label for="category">Category</label>
        <select id="category" name="category">
            <option value="">All categories</option>
            @foreach ($categories as $category)
                <option value="{{ $category->id }}" @selected((string) request('category') === (string) $category->id)>{{ $category->name }}</option>
            @endforeach
        </select>
    </div>
    <div>
        <label for="status">Status</label>
        <select id="status" name="status">
            <option value="">Any status</option>
            @foreach (['open', 'in_review', 'closed'] as $status)
                <option value="{{ $status }}" @selected(request('status') === $status)>{{ ucfirst(str_replace('_', ' ', $status)) }}</option>
            @endforeach
        </select>
    </div>
    <button type="submit">Filter</button>
</form>

@forelse ($bounties as $bounty)
    <article class="card">
        <h2><a href="{{ route('bounties.show', $bounty) }}">{{ $bounty->title }}</a></h2>
        <p class="muted">
            {{ $bounty->category?->name ?? 'Uncategorized' }} ·
            {{ $bounty->status === 'open' ? 'Open' : ucfirst(str_replace('_', ' ', $bounty->status)) }} ·
            @if ($bounty->deadline) closes {{ $bounty->deadline->format('M j, Y') }} · @endif
            sponsored by {{ $bounty->sponsor_name }}
        </p>
        <p><strong>${{ number_format($bounty->reward_usd, 2) }} {{ $bounty->currency }}</strong></p>
        <p>{{ \Illuminate\Support\Str::limit($bounty->description, 180) }}</p>
    </article>
@empty
    <p>No bounties match those filters yet. <a href="{{ route('bounties.create') }}">Post the first one</a>.</p>
@endforelse

{{ $bounties->links() }}
@endsection

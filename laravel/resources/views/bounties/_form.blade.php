<div>
    <label for="title">Title</label>
    <input id="title" type="text" name="title" value="{{ old('title', $bounty->title ?? '') }}" required minlength="5" maxlength="120">
</div>

<div>
    <label for="description">Description</label>
    <textarea id="description" name="description" rows="5" required minlength="20">{{ old('description', $bounty->description ?? '') }}</textarea>
</div>

<div>
    <label for="reward_usd">Reward (USD value)</label>
    <input id="reward_usd" type="number" name="reward_usd" value="{{ old('reward_usd', $bounty->reward_usd ?? '') }}" required min="1" step="0.01">
</div>

<div>
    <label for="currency">Currency</label>
    <select id="currency" name="currency" required>
        @foreach (['USD', 'USDC', 'SOL'] as $currency)
            <option value="{{ $currency }}" @selected(old('currency', $bounty->currency ?? 'USD') === $currency)>{{ $currency }}</option>
        @endforeach
    </select>
</div>

<div>
    <label for="status">Status</label>
    <select id="status" name="status" required>
        @foreach (['open', 'in_review', 'closed'] as $status)
            <option value="{{ $status }}" @selected(old('status', $bounty->status ?? 'open') === $status)>{{ ucfirst(str_replace('_', ' ', $status)) }}</option>
        @endforeach
    </select>
</div>

<div>
    <label for="deadline">Deadline (optional)</label>
    <input id="deadline" type="date" name="deadline" value="{{ old('deadline', isset($bounty->deadline) ? $bounty->deadline->format('Y-m-d') : '') }}">
</div>

<div>
    <label for="category_id">Category</label>
    <select id="category_id" name="category_id" required>
        @foreach ($categories as $category)
            <option value="{{ $category->id }}" @selected((string) old('category_id', $bounty->category_id ?? '') === (string) $category->id)>{{ $category->name }}</option>
        @endforeach
    </select>
</div>

<div>
    <label for="sponsor_name">Sponsor name</label>
    <input id="sponsor_name" type="text" name="sponsor_name" value="{{ old('sponsor_name', $bounty->sponsor_name ?? '') }}" required maxlength="80">
</div>

<div>
    <label for="sponsor_email">Sponsor email</label>
    <input id="sponsor_email" type="email" name="sponsor_email" value="{{ old('sponsor_email', $bounty->sponsor_email ?? '') }}" required>
</div>

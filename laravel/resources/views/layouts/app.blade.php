<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Bounty Board')</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 820px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
        header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: .5rem; }
        a { color: #0b5fff; }
        .flash { background: #e6f4ea; border: 1px solid #4caf50; padding: .6rem; border-radius: 6px; }
        .errors { background: #fce8e6; border: 1px solid #d93025; padding: .6rem; border-radius: 6px; }
        .card { border: 1px solid #ccc; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
        label { display: block; font-weight: 600; margin-top: .75rem; }
        input, select, textarea { width: 100%; padding: .45rem; border: 1px solid #999; border-radius: 6px; font: inherit; }
        button { padding: .5rem 1rem; border-radius: 6px; border: 1px solid #999; cursor: pointer; font: inherit; }
        .muted { color: #555; }
        .filters { display: flex; gap: .5rem; flex-wrap: wrap; align-items: end; margin: 1rem 0; }
        .filters > div { flex: 1 1 160px; }
        nav a { margin-right: .75rem; }
    </style>
</head>
<body>
<header>
    <h1><a href="{{ route('bounties.index') }}">Bounty Board</a></h1>
    <nav><a href="{{ route('bounties.create') }}">Post a bounty</a></nav>
</header>

@if (session('success'))
    <p class="flash" role="status">{{ session('success') }}</p>
@endif

@if ($errors->any())
    <div class="errors" role="alert">
        <strong>Please fix the following:</strong>
        <ul>
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

<main>
    @yield('content')
</main>
</body>
</html>

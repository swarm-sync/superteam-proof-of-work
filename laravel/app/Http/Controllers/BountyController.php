<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBountyRequest;
use App\Http\Requests\UpdateBountyRequest;
use App\Models\Bounty;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class BountyController extends Controller
{
    public function index(Request $request): View
    {
        $bounties = Bounty::with('category')
            ->forCategory($request->integer('category') ?: null)
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('q'), fn ($q) => $q->where(function ($qq) use ($request) {
                $qq->where('title', 'like', '%' . $request->string('q') . '%')
                   ->orWhere('description', 'like', '%' . $request->string('q') . '%');
            }))
            ->orderByDesc('created_at')
            ->paginate(12)
            ->withQueryString();

        return view('bounties.index', [
            'bounties' => $bounties,
            'categories' => Category::orderBy('name')->get(),
        ]);
    }

    public function show(Bounty $bounty): View
    {
        return view('bounties.show', ['bounty' => $bounty->load('category')]);
    }

    public function create(): View
    {
        return view('bounties.create', ['categories' => Category::orderBy('name')->get()]);
    }

    public function store(StoreBountyRequest $request): RedirectResponse
    {
        $bounty = Bounty::create($request->validated());

        return redirect()
            ->route('bounties.show', $bounty)
            ->with('success', 'Bounty created.');
    }

    public function edit(Bounty $bounty): View
    {
        return view('bounties.edit', [
            'bounty' => $bounty,
            'categories' => Category::orderBy('name')->get(),
        ]);
    }

    public function update(UpdateBountyRequest $request, Bounty $bounty): RedirectResponse
    {
        $bounty->update($request->validated());

        return redirect()
            ->route('bounties.show', $bounty)
            ->with('success', 'Bounty updated.');
    }

    public function destroy(Bounty $bounty): RedirectResponse
    {
        $bounty->delete();

        return redirect()
            ->route('bounties.index')
            ->with('success', 'Bounty deleted.');
    }
}

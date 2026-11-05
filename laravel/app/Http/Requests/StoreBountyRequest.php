<?php

namespace App\Http\Requests;

use App\Models\Bounty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBountyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public board demo: no auth. Add a policy/gate before production use.
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:5', 'max:120'],
            'description' => ['required', 'string', 'min:20', 'max:5000'],
            'reward_usd' => ['required', 'numeric', 'min:1', 'max:1000000'],
            'currency' => ['required', 'string', 'in:USD,USDC,SOL'],
            'status' => ['required', Rule::in(Bounty::STATUSES)],
            'deadline' => ['nullable', 'date', 'after_or_equal:today'],
            'category_id' => ['required', 'exists:categories,id'],
            'sponsor_name' => ['required', 'string', 'max:80'],
            'sponsor_email' => ['required', 'email', 'max:255'],
        ];
    }
}

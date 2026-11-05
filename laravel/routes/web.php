<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BountyController;

Route::get('/', fn () => redirect()->route('bounties.index'));

Route::resource('bounties', BountyController::class);

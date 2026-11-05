@extends('layouts.app')

@section('title', 'Edit: ' . $bounty->title . ' — Bounty Board')

@section('content')
<h2>Edit bounty</h2>
<form method="POST" action="{{ route('bounties.update', $bounty) }}">
    @csrf
    @method('PUT')
    @include('bounties._form')
    <p><button type="submit">Save changes</button></p>
</form>
@endsection

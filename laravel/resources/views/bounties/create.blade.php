@extends('layouts.app')

@section('title', 'Post a bounty — Bounty Board')

@section('content')
<h2>Post a bounty</h2>
<form method="POST" action="{{ route('bounties.store') }}">
    @csrf
    @include('bounties._form')
    <p><button type="submit">Create bounty</button></p>
</form>
@endsection

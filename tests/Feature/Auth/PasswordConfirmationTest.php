<?php

use App\Models\User;

test('confirm password screen renders the React app shell', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('password.confirm'));

    $response
        ->assertOk()
        ->assertSee('id="root"', false);
});

test('password confirmation requires authentication', function () {
    $response = $this->get(route('password.confirm'));

    $response->assertRedirect(route('login'));
});

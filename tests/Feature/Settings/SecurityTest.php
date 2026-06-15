<?php

use Illuminate\Support\Facades\Route;

test('security settings routes are not registered in the React SPA admin build', function () {
    expect(Route::has('security.edit'))->toBeFalse()
        ->and(Route::has('user-password.update'))->toBeFalse();
});

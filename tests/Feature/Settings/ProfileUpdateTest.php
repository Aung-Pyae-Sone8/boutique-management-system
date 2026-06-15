<?php

use Illuminate\Support\Facades\Route;

test('profile settings routes are not registered in the React SPA admin build', function () {
    expect(Route::has('profile.edit'))->toBeFalse()
        ->and(Route::has('profile.update'))->toBeFalse()
        ->and(Route::has('profile.destroy'))->toBeFalse();
});

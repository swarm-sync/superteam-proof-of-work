<?php

declare(strict_types=1);

// PSR-4-lite autoloader: BountyApi\Foo maps to src/Foo.php. No Composer needed.
spl_autoload_register(static function (string $class): void {
    $prefix = 'BountyApi\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $file = __DIR__ . '/' . substr($class, strlen($prefix)) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

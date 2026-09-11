<?php

namespace Tests\Support;

use App\Contracts\OtpGeneratorInterface;

final class TestingOtpGenerator implements OtpGeneratorInterface
{
    private ?string $nextCode = null;

    private ?string $lastGeneratedCode = null;

    public function generate(): string
    {
        $code = $this->nextCode ?? (string) random_int(100000, 999999);
        $this->lastGeneratedCode = $code;

        return $code;
    }

    public function setNextCode(string $code): self
    {
        $this->nextCode = $code;

        return $this;
    }

    public function getLastGeneratedCode(): ?string
    {
        return $this->lastGeneratedCode;
    }

    public function reset(): void
    {
        $this->nextCode = null;
        $this->lastGeneratedCode = null;
    }
}

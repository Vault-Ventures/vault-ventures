<?php

namespace App\Services\Financial;

use App\Models\FinancialReportEvidence;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class FinancialEvidenceStorage
{
    public const DISK = 'financial_evidence';

    public const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
    ];

    public const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MiB

    public const MAX_FILES_PER_REPORT = 10;

    public function newPath(int $dealId): string
    {
        return $dealId.'/'.Str::uuid().'.enc';
    }

    public function validateFile(UploadedFile $file): void
    {
        $mime = $file->getMimeType();
        if (! in_array($mime, self::ALLOWED_MIME_TYPES, true)) {
            throw ValidationException::withMessages([
                'file' => ['The evidence file must be a PDF, JPEG, or PNG document.'],
            ]);
        }

        if ($file->getSize() > self::MAX_FILE_SIZE_BYTES) {
            throw ValidationException::withMessages([
                'file' => ['The evidence file size must not exceed 10 MiB.'],
            ]);
        }
    }

    public function put(string $path, UploadedFile $file): void
    {
        $bytes = file_get_contents($file->getRealPath());
        if ($bytes === false || ! Storage::disk(self::DISK)->put($path, Crypt::encryptString($bytes))) {
            throw new RuntimeException('Financial evidence storage failed.');
        }
    }

    public function cleanup(string $path): void
    {
        if (Storage::disk(self::DISK)->exists($path) && ! Storage::disk(self::DISK)->delete($path)) {
            throw new RuntimeException('Financial evidence cleanup failed.');
        }
    }

    public function read(FinancialReportEvidence $evidence): string
    {
        $dealId = $evidence->financialReport->deal_id;

        // Never let metadata redirect reads to another disk or outside the generated namespace.
        if ($evidence->disk !== self::DISK
            || ! preg_match('/^'.preg_quote((string) $dealId, '/').'\/[0-9a-f-]{36}\.enc$/D', $evidence->path)) {
            throw new RuntimeException('Invalid financial evidence storage reference.');
        }

        $disk = Storage::disk(self::DISK);
        abort_unless($disk->exists($evidence->path), 404);
        $encrypted = $disk->get($evidence->path);
        if (! is_string($encrypted)) {
            throw new RuntimeException('Financial evidence read failed.');
        }

        return Crypt::decryptString($encrypted);
    }
}

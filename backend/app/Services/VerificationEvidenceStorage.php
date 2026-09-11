<?php

namespace App\Services;

use App\Models\VerificationEvidence;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class VerificationEvidenceStorage
{
    public const DISK = 'verification_evidence';

    public const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
    ];

    public const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MiB

    public const MAX_FILES_PER_REQUEST = 5;

    public function newPath(int $requestId): string
    {
        return $requestId.'/'.Str::uuid().'.enc';
    }

    public function validateFile(UploadedFile $file): void
    {
        $mime = $file->getMimeType();
        if (! in_array($mime, self::ALLOWED_MIME_TYPES, true)) {
            throw ValidationException::withMessages([
                'file' => ['The file must be a PDF, JPEG, or PNG document.'],
            ]);
        }

        if ($file->getSize() > self::MAX_FILE_SIZE_BYTES) {
            throw ValidationException::withMessages([
                'file' => ['The file size must not exceed 5 MiB.'],
            ]);
        }
    }

    public function put(string $path, UploadedFile $file): void
    {
        $bytes = file_get_contents($file->getRealPath());
        if ($bytes === false || ! Storage::disk(self::DISK)->put($path, Crypt::encryptString($bytes))) {
            throw new RuntimeException('Verification evidence storage failed.');
        }
    }

    public function cleanup(string $path): void
    {
        if (Storage::disk(self::DISK)->exists($path) && ! Storage::disk(self::DISK)->delete($path)) {
            throw new RuntimeException('Verification evidence cleanup failed.');
        }
    }

    public function read(VerificationEvidence $evidence): string
    {
        // Never let metadata redirect reads to another disk or outside the generated namespace.
        if ($evidence->disk !== self::DISK
            || ! preg_match('/^'.preg_quote((string) $evidence->verification_request_id, '/').'\/[0-9a-f-]{36}\.enc$/D', $evidence->path)) {
            throw new RuntimeException('Invalid verification evidence storage reference.');
        }

        $disk = Storage::disk(self::DISK);
        abort_unless($disk->exists($evidence->path), 404);
        $encrypted = $disk->get($evidence->path);
        if (! is_string($encrypted)) {
            throw new RuntimeException('Verification evidence read failed.');
        }

        return Crypt::decryptString($encrypted);
    }
}

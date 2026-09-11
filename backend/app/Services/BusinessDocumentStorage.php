<?php

namespace App\Services;

use App\Models\BusinessDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class BusinessDocumentStorage
{
    public const DISK = 'business_documents';

    public function newPath(int $businessId): string
    {
        return $businessId.'/'.Str::uuid().'.enc';
    }

    public function put(string $path, UploadedFile $file): void
    {
        $bytes = file_get_contents($file->getRealPath());
        if ($bytes === false || ! Storage::disk(self::DISK)->put($path, Crypt::encryptString($bytes))) {
            throw new RuntimeException('Document storage failed.');
        }
    }

    public function cleanup(string $path): void
    {
        if (! Storage::disk(self::DISK)->delete($path)) {
            throw new RuntimeException('Document cleanup failed.');
        }
    }

    public function read(BusinessDocument $document): string
    {
        // Never let metadata redirect reads to another disk or outside the generated namespace.
        if ($document->disk !== self::DISK
            || ! preg_match('/^'.preg_quote((string) $document->business_id, '/').'\/[0-9a-f-]{36}\.enc$/D', $document->path)) {
            throw new RuntimeException('Invalid document storage reference.');
        }
        $disk = Storage::disk(self::DISK);
        abort_unless($disk->exists($document->path), 404);
        $encrypted = $disk->get($document->path);
        if (! is_string($encrypted)) {
            throw new RuntimeException('Document read failed.');
        }

        return Crypt::decryptString($encrypted);
    }
}

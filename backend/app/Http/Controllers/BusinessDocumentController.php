<?php

namespace App\Http\Controllers;

use App\Http\Requests\Businesses\ListBusinessDocumentsRequest;
use App\Http\Requests\Businesses\StoreBusinessDocumentRequest;
use App\Http\Resources\BusinessDocumentResource;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Models\BusinessDocument;
use App\Models\DocumentAccessLog;
use App\Services\BusinessDocumentStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class BusinessDocumentController extends Controller
{
    public function index(ListBusinessDocumentsRequest $request, string $business): JsonResponse
    {
        $owned = $request->user()->founderProfile->businesses()->findOrFail($business);
        Gate::authorize('viewAny', [BusinessDocument::class, $owned]);

        return ApiResponse::success(BusinessDocumentResource::collection($owned->documents()->orderBy('id')->get())->resolve($request));
    }

    public function store(StoreBusinessDocumentRequest $request, string $business, BusinessDocumentStorage $storage): JsonResponse
    {
        $path = null;
        try {
            // Do not retry a transaction with filesystem side effects.
            $document = DB::transaction(function () use ($request, $business, $storage, &$path) {
                $owned = $request->user()->founderProfile->businesses()->lockForUpdate()->findOrFail($business);
                Gate::authorize('create', [BusinessDocument::class, $owned]);
                if ($owned->documents()->count() >= 10) {
                    throw ValidationException::withMessages(['file' => ['A business may have at most 10 documents.']]);
                }
                $file = $request->file('file');
                $path = $storage->newPath($owned->id);
                $storage->put($path, $file);
                $document = new BusinessDocument;
                $document->business_id = $owned->id;
                $document->kind = $request->validated('kind');
                $name = basename(str_replace('\\', '/', $file->getClientOriginalName()));
                $document->original_name = preg_replace('/[\x00-\x1F\x7F]/u', '', $name);
                $document->disk = BusinessDocumentStorage::DISK;
                $document->path = $path;
                $document->mime_type = 'application/pdf';
                $document->size_bytes = $file->getSize();
                $document->save();

                return $document;
            });
        } catch (Throwable $exception) {
            if ($path !== null) {
                try {
                    $storage->cleanup($path);
                } catch (Throwable $cleanupFailure) {
                    report($cleanupFailure);
                }
            }
            throw $exception;
        }

        return ApiResponse::success((new BusinessDocumentResource($document))->resolve($request), 'Document uploaded.', 201);
    }

    public function download(Request $request, string $business, string $document, BusinessDocumentStorage $storage): Response
    {
        Gate::authorize('viewAny', Business::class);
        $owned = $request->user()->founderProfile->businesses()->findOrFail($business);
        $record = $owned->documents()->findOrFail($document);
        Gate::authorize('download', $record);
        $bytes = $storage->read($record);
        // Fail closed: no response body is returned if this audit insert fails.
        $log = new DocumentAccessLog;
        $log->business_document_id = $record->id;
        $log->actor_user_id = $request->user()->id;
        $log->action = 'download_initiated';
        $log->occurred_at = now();
        $log->save();

        return response($bytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => HeaderUtils::makeDisposition('attachment', $record->original_name, 'document.pdf'),
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}

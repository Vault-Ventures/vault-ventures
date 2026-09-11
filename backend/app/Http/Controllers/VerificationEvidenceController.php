<?php

namespace App\Http\Controllers;

use App\Enums\VerificationRequestStatus;
use App\Enums\VerificationTier;
use App\Http\Requests\Verification\StoreVerificationEvidenceRequest;
use App\Http\Resources\VerificationEvidenceResource;
use App\Http\Responses\ApiResponse;
use App\Models\VerificationEvidence;
use App\Models\VerificationRequest;
use App\Services\VerificationEvidenceStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Throwable;

final class VerificationEvidenceController extends Controller
{
    public function __construct(
        private readonly VerificationEvidenceStorage $storage,
    ) {}

    public function index(Request $request, string $verification_request): JsonResponse
    {
        $verificationRequest = VerificationRequest::findOrFail($verification_request);
        Gate::authorize('view', $verificationRequest);

        $evidence = $verificationRequest->evidence()->orderBy('id')->get();

        return ApiResponse::success(
            VerificationEvidenceResource::collection($evidence)->resolve($request)
        );
    }

    public function store(StoreVerificationEvidenceRequest $request, string $verification_request): JsonResponse
    {
        $path = null;

        try {
            $evidence = DB::transaction(function () use ($request, $verification_request, &$path) {
                /** @var VerificationRequest $verificationRequest */
                $verificationRequest = VerificationRequest::lockForUpdate()->findOrFail($verification_request);

                Gate::authorize('uploadEvidence', $verificationRequest);

                if ($verificationRequest->requested_tier !== VerificationTier::Tier1) {
                    throw ValidationException::withMessages([
                        'verification_request' => ['Evidence upload is only permitted for Tier 1 identity verification requests.'],
                    ]);
                }

                if (! in_array($verificationRequest->status, [
                    VerificationRequestStatus::Pending,
                    VerificationRequestStatus::UnderReview,
                    VerificationRequestStatus::NeedsInformation,
                ], true)) {
                    throw ValidationException::withMessages([
                        'verification_request' => ['Evidence cannot be uploaded to a closed or finalized verification request.'],
                    ]);
                }

                if ($verificationRequest->evidence()->count() >= VerificationEvidenceStorage::MAX_FILES_PER_REQUEST) {
                    throw ValidationException::withMessages([
                        'file' => ['A maximum of 5 evidence files may be uploaded per verification request.'],
                    ]);
                }

                $file = $request->file('file');
                $this->storage->validateFile($file);

                $path = $this->storage->newPath($verificationRequest->id);
                $this->storage->put($path, $file);

                $rawName = basename(str_replace('\\', '/', $file->getClientOriginalName()));
                $cleanName = preg_replace('/[\x00-\x1F\x7F]/u', '', $rawName);

                $evidence = new VerificationEvidence;
                $evidence->verification_request_id = $verificationRequest->id;
                $evidence->uploaded_by_user_id = $request->user()->id;
                $evidence->disk = VerificationEvidenceStorage::DISK;
                $evidence->path = $path;
                $evidence->original_filename = $cleanName ?: 'evidence';
                $evidence->mime_type = $file->getMimeType();
                $evidence->file_size_bytes = $file->getSize();
                $evidence->save();

                return $evidence;
            });
        } catch (Throwable $e) {
            if ($path !== null) {
                try {
                    $this->storage->cleanup($path);
                } catch (Throwable $cleanupError) {
                    report($cleanupError);
                }
            }
            throw $e;
        }

        return ApiResponse::success(
            (new VerificationEvidenceResource($evidence))->resolve($request),
            'Verification evidence uploaded successfully.',
            201
        );
    }
}

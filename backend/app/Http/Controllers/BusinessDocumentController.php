<?php

namespace App\Http\Controllers;

use App\Enums\BusinessStatus;
use App\Enums\DisclosureStage;
use App\Enums\NdaStatus;
use App\Enums\ParticipantRole;
use App\Http\Requests\Businesses\ListBusinessDocumentsRequest;
use App\Http\Requests\Businesses\StoreBusinessDocumentRequest;
use App\Http\Resources\BusinessDocumentResource;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use App\Models\BusinessDisclosureRelationship;
use App\Models\BusinessDocument;
use App\Models\BusinessNda;
use App\Models\DocumentAccessLog;
use App\Models\User;
use App\Services\BusinessDocumentStorage;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class BusinessDocumentController extends Controller
{
    /**
     * List accessible documents for a business based on caller's role/disclosure stage.
     */
    public function index(ListBusinessDocumentsRequest $request, string $business): JsonResponse
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $this->enforceBusinessAndRoleAccess($businessModel, $user);

        $isOwner = $businessModel->founderProfile !== null && $businessModel->founderProfile->user_id === $user->id;
        if ($isOwner) {
            return ApiResponse::success(
                BusinessDocumentResource::collection($businessModel->documents()->orderBy('id')->get())->resolve($request)
            );
        }

        $this->validateMultiRoleUser($request, $user);

        $relationship = BusinessDisclosureRelationship::where('business_id', $businessModel->id)
            ->where('counterparty_user_id', $user->id)
            ->first();

        if ($relationship === null || $relationship->stage === DisclosureStage::Teaser || $relationship->stage === DisclosureStage::Extended) {
            return ApiResponse::success([]);
        }

        if ($relationship->stage === DisclosureStage::Nda || $relationship->stage === DisclosureStage::FullProposal) {
            $this->enforceTierAndNdaRequirements($businessModel, $user, $relationship);

            if ($relationship->stage === DisclosureStage::Nda) {
                $docs = $businessModel->documents()->where('kind', 'pitch_deck')->orderBy('id')->get();

                return ApiResponse::success(BusinessDocumentResource::collection($docs)->resolve($request));
            }

            if ($relationship->stage === DisclosureStage::FullProposal) {
                $docs = $businessModel->documents()->orderBy('id')->get();

                return ApiResponse::success(BusinessDocumentResource::collection($docs)->resolve($request));
            }
        }

        return ApiResponse::success([]);
    }

    /**
     * Store a newly uploaded document for the business (Founder owner only).
     */
    public function store(StoreBusinessDocumentRequest $request, string $business, BusinessDocumentStorage $storage): JsonResponse
    {
        $path = null;
        try {
            $document = DB::transaction(function () use ($request, $business, $storage, &$path) {
                $businessModel = Business::lockForUpdate()->findOrFail($business);
                $user = $request->user();

                $this->enforceBusinessAndRoleAccess($businessModel, $user);

                $isOwner = $businessModel->founderProfile !== null && $businessModel->founderProfile->user_id === $user->id;
                if (! $isOwner) {
                    throw new HttpException(403, 'Only the business founder can upload documents.');
                }

                if ($businessModel->documents()->count() >= 10) {
                    throw ValidationException::withMessages(['file' => ['A business may have at most 10 documents.']]);
                }

                $file = $request->file('file');
                $path = $storage->newPath($businessModel->id);
                $storage->put($path, $file);

                $document = new BusinessDocument;
                $document->business_id = $businessModel->id;
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

    /**
     * Download a private document with stage-gated access control and mandatory audit logging.
     */
    public function download(Request $request, string $business, string $document, BusinessDocumentStorage $storage): Response
    {
        $businessModel = Business::findOrFail($business);
        $user = $request->user();

        $this->enforceBusinessAndRoleAccess($businessModel, $user);

        $record = $businessModel->documents()->findOrFail($document);

        $isOwner = $businessModel->founderProfile !== null && $businessModel->founderProfile->user_id === $user->id;
        if (! $isOwner) {
            $this->validateMultiRoleUser($request, $user);

            $relationship = BusinessDisclosureRelationship::where('business_id', $businessModel->id)
                ->where('counterparty_user_id', $user->id)
                ->first();

            if ($relationship === null || $relationship->stage === DisclosureStage::Teaser || $relationship->stage === DisclosureStage::Extended) {
                throw new HttpException(403, 'Document access requires Stage 3 (NDA Protected) or higher.');
            }

            if ($relationship->stage === DisclosureStage::Nda) {
                $this->enforceTierAndNdaRequirements($businessModel, $user, $relationship);

                if ($record->kind !== 'pitch_deck') {
                    throw new HttpException(403, 'Business Plan document is restricted to Stage 4 (Full Proposal).');
                }
            } elseif ($relationship->stage === DisclosureStage::FullProposal) {
                $this->enforceTierAndNdaRequirements($businessModel, $user, $relationship);
            } else {
                throw new HttpException(403, 'Unauthorized disclosure stage for document access.');
            }
        }

        $bytes = $storage->read($record);

        // Fail closed: audit logging must succeed before file stream is returned.
        $log = new DocumentAccessLog;
        $log->business_document_id = $record->id;
        $log->actor_user_id = $user->id;
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

    /**
     * Enforce participant role authorization and draft isolation boundary.
     *
     * @throws HttpException
     * @throws ModelNotFoundException
     */
    private function enforceBusinessAndRoleAccess(Business $business, User $user): void
    {
        $isOwner = $business->founderProfile !== null && $business->founderProfile->user_id === $user->id;
        if ($isOwner) {
            return;
        }

        $hasFounder = $user->hasRole(ParticipantRole::Founder);
        $hasInvestor = $user->hasRole(ParticipantRole::Investor);
        $hasProfessional = $user->hasRole(ParticipantRole::Professional);

        if (! $hasFounder && ! $hasInvestor && ! $hasProfessional) {
            throw new HttpException(403, 'User does not possess an authorized participant role.');
        }

        if ($business->status !== BusinessStatus::Submitted) {
            throw (new ModelNotFoundException)->setModel(Business::class, [$business->id]);
        }
    }

    /**
     * Validate role parameter for multi-role users.
     *
     * @throws HttpException
     * @throws ValidationException
     */
    private function validateMultiRoleUser(Request $request, User $user): void
    {
        $hasInvestor = $user->hasRole(ParticipantRole::Investor);
        $hasProfessional = $user->hasRole(ParticipantRole::Professional);

        if (! $hasInvestor && ! $hasProfessional) {
            throw new HttpException(403, 'Only Investors, Skilled Professionals, or the business owner can access documents.');
        }

        if ($hasInvestor && $hasProfessional) {
            $roleParam = $request->input('role') ?? $request->query('role');
            if ($roleParam === null || trim((string) $roleParam) === '') {
                throw ValidationException::withMessages([
                    'role' => ['Role parameter (investor or professional) is required for multi-role users.'],
                ]);
            }

            $normalized = strtolower(trim((string) $roleParam));
            if (! in_array($normalized, ['investor', 'professional'], true)) {
                throw ValidationException::withMessages([
                    'role' => ['Invalid role parameter. Must be "investor" or "professional".'],
                ]);
            }
        } elseif ($hasInvestor) {
            $roleParam = $request->input('role') ?? $request->query('role');
            if ($roleParam !== null && strtolower(trim((string) $roleParam)) !== 'investor') {
                throw new HttpException(403, 'User does not possess the requested role.');
            }
        } else {
            $roleParam = $request->input('role') ?? $request->query('role');
            if ($roleParam !== null && strtolower(trim((string) $roleParam)) !== 'professional') {
                throw new HttpException(403, 'User does not possess the requested role.');
            }
        }
    }

    /**
     * Enforce Tier 1 verification and active NDA requirements for Stage 3/4 document access.
     *
     * @throws HttpException
     */
    private function enforceTierAndNdaRequirements(
        Business $business,
        User $counterparty,
        BusinessDisclosureRelationship $relationship
    ): void {
        $founderUser = $business->founderProfile?->user;
        if ($founderUser === null || ! $founderUser->isIdentityVerified() || ! $counterparty->isIdentityVerified()) {
            throw new HttpException(403, 'Tier 1 identity verification is required for document access at Stage '.$relationship->stage->value.'.');
        }

        $nda = BusinessNda::where('business_id', $business->id)
            ->where('counterparty_user_id', $counterparty->id)
            ->first();

        if ($nda === null || $nda->status !== NdaStatus::Active) {
            throw new HttpException(403, 'An active bilateral NDA is required for document access at Stage '.$relationship->stage->value.'.');
        }

        if ($relationship->stage === DisclosureStage::FullProposal && $relationship->stage_4_confirmed_at === null) {
            throw new HttpException(403, 'Stage 4 has not been confirmed by the founder.');
        }
    }
}

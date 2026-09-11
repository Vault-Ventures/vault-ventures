<?php

namespace App\Http\Controllers;

use App\Http\Requests\Verification\CreateVerificationRequestRequest;
use App\Http\Resources\VerificationRequestResource;
use App\Http\Responses\ApiResponse;
use App\Models\VerificationRequest;
use App\Services\VerificationRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class VerificationRequestController extends Controller
{
    public function __construct(
        private readonly VerificationRequestService $verificationRequestService,
    ) {}

    public function store(CreateVerificationRequestRequest $request): JsonResponse
    {
        $verificationRequest = $this->verificationRequestService->createTier1Request($request->user());

        return ApiResponse::success(
            (new VerificationRequestResource($verificationRequest))->resolve($request),
            'Verification request submitted successfully.',
            201
        );
    }

    public function latest(Request $request): JsonResponse
    {
        $latest = $this->verificationRequestService->getLatestRequest($request->user());

        return ApiResponse::success(
            $latest ? (new VerificationRequestResource($latest))->resolve($request) : null
        );
    }

    public function show(Request $request, string $verification_request): JsonResponse
    {
        $record = VerificationRequest::findOrFail($verification_request);
        Gate::authorize('view', $record);

        return ApiResponse::success(
            (new VerificationRequestResource($record))->resolve($request)
        );
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendPhoneVerificationCodeRequest;
use App\Http\Requests\Auth\VerifyPhoneCodeRequest;
use App\Http\Responses\ApiResponse;
use App\Services\PhoneVerificationService;
use Illuminate\Http\JsonResponse;

final class PhoneVerificationController extends Controller
{
    public function __construct(
        private readonly PhoneVerificationService $phoneVerificationService,
    ) {}

    public function sendCode(SendPhoneVerificationCodeRequest $request): JsonResponse
    {
        $this->phoneVerificationService->sendCode(
            $request->user(),
            $request->validated('phone'),
        );

        return ApiResponse::success(
            null,
            'Verification code sent.'
        );
    }

    public function verifyCode(VerifyPhoneCodeRequest $request): JsonResponse
    {
        $this->phoneVerificationService->verifyCode(
            $request->user(),
            $request->validated('code'),
        );

        return ApiResponse::success(
            null,
            'Phone verified.'
        );
    }
}

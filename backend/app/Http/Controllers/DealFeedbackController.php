<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\Deal;
use App\Services\Reputation\ReputationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DealFeedbackController extends Controller
{
    public function __construct(
        protected ReputationService $reputationService
    ) {}

    /**
     * Get feedback status for a deal.
     *
     * @throws ValidationException
     */
    public function show(Request $request, Deal $deal): JsonResponse
    {
        $status = $this->reputationService->getDealFeedbackStatus(
            $deal,
            $request->user(),
            $request->query('role')
        );

        return ApiResponse::success(
            $status,
            'Deal feedback status retrieved successfully.'
        );
    }

    /**
     * Submit post-deal feedback.
     *
     * @throws ValidationException
     */
    public function store(Request $request, Deal $deal): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'role' => ['nullable', 'string'],
        ]);

        $feedback = $this->reputationService->submitDealFeedback(
            $deal,
            $request->user(),
            (int) $validated['rating'],
            $validated['comment'] ?? null,
            $validated['role'] ?? null
        );

        return ApiResponse::success([
            'id' => $feedback->id,
            'deal_id' => $feedback->deal_id,
            'reviewer_user_id' => $feedback->reviewer_user_id,
            'reviewer_role' => $feedback->reviewer_role->value,
            'recipient_user_id' => $feedback->recipient_user_id,
            'recipient_role' => $feedback->recipient_role->value,
            'rating' => $feedback->rating,
            'comment' => $feedback->comment,
            'submitted_at' => $feedback->created_at?->toISOString(),
        ], 'Feedback submitted successfully.', 201);
    }
}

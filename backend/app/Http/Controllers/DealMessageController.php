<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\Deal;
use App\Services\Deal\DealMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DealMessageController extends Controller
{
    /**
     * List all messages for a specific deal.
     */
    public function index(
        Request $request,
        string $deal,
        DealMessageService $messageService
    ): JsonResponse {
        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $messages = $messageService->listMessages(
            $dealModel,
            $user,
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            ['messages' => $messages],
            'Deal messages retrieved successfully.'
        );
    }

    /**
     * Send and persist a new message in the deal room.
     */
    public function store(
        Request $request,
        string $deal,
        DealMessageService $messageService
    ): JsonResponse {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000', function ($attribute, $value, $fail) {
                if (trim($value) === '') {
                    $fail('The message body cannot be empty.');
                }
            }],
        ]);

        $dealModel = Deal::findOrFail($deal);
        $user = $request->user();
        $roleParam = $request->input('role') ?? $request->query('role');

        $message = $messageService->sendMessage(
            $dealModel,
            $user,
            $validated['body'],
            is_string($roleParam) ? $roleParam : null
        );

        return ApiResponse::success(
            $message,
            'Message sent successfully.',
            201
        );
    }
}

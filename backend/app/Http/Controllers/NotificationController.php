<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    /**
     * List notifications for the authenticated user, newest first.
     * Returns up to 50 items.
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (DatabaseNotification $n) => $this->formatNotification($n));

        return ApiResponse::success($notifications->values()->all());
    }

    /**
     * Return the count of unread notifications for the authenticated user.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $request->user()->unreadNotifications()->count();

        return ApiResponse::success(['unread_count' => $count]);
    }

    /**
     * Mark a single notification as read.
     * Returns 403 if the notification does not belong to the authenticated user.
     */
    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if ($notification === null) {
            return ApiResponse::error('Notification not found.', 'NOT_FOUND', 404);
        }

        $notification->markAsRead();

        return ApiResponse::success($this->formatNotification($notification->fresh()));
    }

    /**
     * Mark all notifications as read for the authenticated user.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return ApiResponse::success(null, 'All notifications marked as read.');
    }

    /**
     * Format a database notification for the API response.
     */
    private function formatNotification(DatabaseNotification $notification): array
    {
        $data = is_array($notification->data) ? $notification->data : json_decode($notification->data, true) ?? [];

        return [
            'id'         => $notification->id,
            'type'       => $data['type'] ?? class_basename($notification->type),
            'title'      => $data['title'] ?? 'Notification',
            'body'       => $data['body'] ?? '',
            'data'       => $data,
            'read_at'    => $notification->read_at?->toISOString(),
            'is_unread'  => $notification->read_at === null,
            'created_at' => $notification->created_at->toISOString(),
        ];
    }
}

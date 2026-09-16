<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationPreferenceController extends Controller
{
    /**
     * Valid preference keys that can be toggled.
     */
    private const ALLOWED_KEYS = [
        'new_matches',
        'interest_received',
        'deal_room_updates',
        'milestone_updates',
    ];

    /**
     * Retrieve the current notification preferences for the authenticated user.
     */
    public function show(Request $request): JsonResponse
    {
        $prefs = $this->getPrefs($request);

        return ApiResponse::success($prefs);
    }

    /**
     * Update notification preferences.
     * Only known keys are accepted; unknown keys are ignored.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate(
            array_fill_keys(
                array_map(fn (string $k) => "preferences.{$k}", self::ALLOWED_KEYS),
                ['sometimes', 'boolean']
            )
        );

        $incoming = $validated['preferences'] ?? [];

        $user = $request->user();

        DB::transaction(function () use ($user, $incoming) {
            // Reload inside transaction for safe JSON merge
            $user->refresh();

            $currentPrefs = is_array($user->preferences) ? $user->preferences : [];
            $currentNotifPrefs = $currentPrefs['notification_prefs'] ?? [];

            // Only update known keys
            foreach (self::ALLOWED_KEYS as $key) {
                if (array_key_exists($key, $incoming)) {
                    $currentNotifPrefs[$key] = (bool) $incoming[$key];
                }
            }

            $currentPrefs['notification_prefs'] = $currentNotifPrefs;
            $user->preferences = $currentPrefs;
            $user->save();
        });

        $user->refresh();

        return ApiResponse::success(
            $this->getPrefs($request, $user),
            'Notification preferences updated.'
        );
    }

    /**
     * Build the preferences response — defaults to true for any unset key.
     */
    private function getPrefs(Request $request, ?\App\Models\User $user = null): array
    {
        $user ??= $request->user();
        $prefs = is_array($user->preferences) ? $user->preferences : [];
        $notifPrefs = $prefs['notification_prefs'] ?? [];

        $result = [];
        foreach (self::ALLOWED_KEYS as $key) {
            // Default: enabled (true) unless explicitly set to false
            $result[$key] = isset($notifPrefs[$key]) ? (bool) $notifPrefs[$key] : true;
        }

        return $result;
    }
}

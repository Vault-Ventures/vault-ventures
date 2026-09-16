<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class UserPhotoController extends Controller
{
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'file', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ]);

        $file = $request->file('avatar');
        if (! $file || ! $file->isValid()) {
            throw ValidationException::withMessages([
                'avatar' => ['Invalid image file uploaded.'],
            ]);
        }

        return DB::transaction(function () use ($request, $file) {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);

            // Delete existing avatar if locally stored
            if ($user->avatar_url && str_starts_with($user->avatar_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $user->avatar_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $file->store('avatars', 'public');
            $url = '/storage/'.$path;

            $user->avatar_url = $url;
            $user->save();

            return ApiResponse::success([
                'avatar_url' => $url,
            ], 'Avatar uploaded successfully.');
        }, 3);
    }

    public function uploadCoverPhoto(Request $request): JsonResponse
    {
        $request->validate([
            'cover_photo' => ['required', 'file', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ]);

        $file = $request->file('cover_photo');
        if (! $file || ! $file->isValid()) {
            throw ValidationException::withMessages([
                'cover_photo' => ['Invalid image file uploaded.'],
            ]);
        }

        return DB::transaction(function () use ($request, $file) {
            $user = User::query()->lockForUpdate()->findOrFail($request->user()->id);

            // Delete existing cover photo if locally stored
            if ($user->cover_photo_url && str_starts_with($user->cover_photo_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $user->cover_photo_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $file->store('covers', 'public');
            $url = '/storage/'.$path;

            $user->cover_photo_url = $url;
            $user->save();

            return ApiResponse::success([
                'cover_photo_url' => $url,
            ], 'Cover photo uploaded successfully.');
        }, 3);
    }
}

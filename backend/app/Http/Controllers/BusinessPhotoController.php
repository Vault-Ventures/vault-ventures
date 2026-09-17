<?php

namespace App\Http\Controllers;

use App\Http\Resources\BusinessResource;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BusinessPhotoController extends Controller
{
    public function uploadLogo(Request $request, string $business): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'file', 'mimes:jpeg,png,jpg,webp,svg', 'max:5120'],
        ]);

        $file = $request->file('logo');
        if (! $file || ! $file->isValid()) {
            throw ValidationException::withMessages([
                'logo' => ['Invalid image file uploaded.'],
            ]);
        }

        return DB::transaction(function () use ($request, $business, $file) {
            $owned = $request->user()->founderProfile->businesses()->lockForUpdate()->findOrFail($business);
            Gate::authorize('update', $owned);

            if ($owned->logo_url && str_starts_with($owned->logo_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $owned->logo_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $file->store('business-logos', 'public');
            $url = '/storage/'.$path;

            $owned->logo_url = $url;
            $owned->save();

            return ApiResponse::success([
                'logo_url' => $url,
                'business' => (new BusinessResource($owned->load('requirements.skills')))->resolve($request),
            ], 'Business logo uploaded successfully.');
        }, 3);
    }

    public function uploadCoverPhoto(Request $request, string $business): JsonResponse
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

        return DB::transaction(function () use ($request, $business, $file) {
            $owned = $request->user()->founderProfile->businesses()->lockForUpdate()->findOrFail($business);
            Gate::authorize('update', $owned);

            if ($owned->cover_photo_url && str_starts_with($owned->cover_photo_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $owned->cover_photo_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $file->store('business-covers', 'public');
            $url = '/storage/'.$path;

            $owned->cover_photo_url = $url;
            $owned->save();

            return ApiResponse::success([
                'cover_photo_url' => $url,
                'business' => (new BusinessResource($owned->load('requirements.skills')))->resolve($request),
            ], 'Business cover photo uploaded successfully.');
        }, 3);
    }
}

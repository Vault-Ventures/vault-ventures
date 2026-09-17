<?php

namespace App\Http\Controllers;

use App\Enums\BusinessStatus;
use App\Http\Resources\BusinessResource;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminBusinessController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $query = Business::with(['founderProfile.user', 'requirements.skills', 'approvedByUser', 'rejectedByUser'])
            ->latest('submitted_at')
            ->latest('updated_at');

        if ($status && $status !== 'all') {
            if ($status === 'pending_approval' || $status === 'pending') {
                $query->where('status', BusinessStatus::PendingApproval);
            } elseif ($status === 'approved') {
                $query->where('status', BusinessStatus::Approved);
            } elseif ($status === 'published') {
                $query->whereIn('status', [BusinessStatus::Published, BusinessStatus::Submitted]);
            } elseif ($status === 'rejected') {
                $query->where('status', BusinessStatus::Rejected);
            } elseif ($status === 'draft') {
                $query->where('status', BusinessStatus::Draft);
            }
        }

        $items = $query->get()->map(function (Business $b) use ($request) {
            $res = (new BusinessResource($b))->resolve($request);
            $res['founder'] = $b->founderProfile?->user ? [
                'id' => $b->founderProfile->user->id,
                'name' => $b->founderProfile->user->name,
                'email' => $b->founderProfile->user->email,
            ] : null;
            $res['approved_by'] = $b->approvedByUser ? [
                'id' => $b->approvedByUser->id,
                'name' => $b->approvedByUser->name,
            ] : null;
            $res['rejected_by'] = $b->rejectedByUser ? [
                'id' => $b->rejectedByUser->id,
                'name' => $b->rejectedByUser->name,
            ] : null;
            return $res;
        });

        return ApiResponse::success(['businesses' => $items]);
    }

    public function show(Request $request, string $business): JsonResponse
    {
        $record = Business::with(['founderProfile.user', 'requirements.skills', 'approvedByUser', 'rejectedByUser'])->findOrFail($business);
        $res = (new BusinessResource($record))->resolve($request);
        $res['founder'] = $record->founderProfile?->user ? [
            'id' => $record->founderProfile->user->id,
            'name' => $record->founderProfile->user->name,
            'email' => $record->founderProfile->user->email,
        ] : null;
        $res['approved_by'] = $record->approvedByUser ? [
            'id' => $record->approvedByUser->id,
            'name' => $record->approvedByUser->name,
        ] : null;
        $res['rejected_by'] = $record->rejectedByUser ? [
            'id' => $record->rejectedByUser->id,
            'name' => $record->rejectedByUser->name,
        ] : null;

        return ApiResponse::success($res);
    }

    public function approve(Request $request, string $business): JsonResponse
    {
        return DB::transaction(function () use ($request, $business) {
            $record = Business::with('founderProfile')->lockForUpdate()->findOrFail($business);

            // Self-approval restriction
            if ($record->founderProfile?->user_id === $request->user()->id) {
                return ApiResponse::error('Administrators cannot approve their own business.', 'FORBIDDEN', 403);
            }

            $record->status = BusinessStatus::Approved;
            $record->approved_at = now();
            $record->approved_by_user_id = $request->user()->id;
            $record->rejected_at = null;
            $record->rejected_by_user_id = null;
            $record->rejection_reason = null;
            $record->save();

            return ApiResponse::success((new BusinessResource($record->load('requirements.skills')))->resolve($request), 'Business approved successfully.');
        }, 3);
    }

    public function reject(Request $request, string $business): JsonResponse
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:3|max:1000',
        ]);

        return DB::transaction(function () use ($request, $business, $validated) {
            $record = Business::with('founderProfile')->lockForUpdate()->findOrFail($business);

            // Self-rejection restriction
            if ($record->founderProfile?->user_id === $request->user()->id) {
                return ApiResponse::error('Administrators cannot reject their own business.', 'FORBIDDEN', 403);
            }

            $record->status = BusinessStatus::Rejected;
            $record->rejected_at = now();
            $record->rejected_by_user_id = $request->user()->id;
            $record->rejection_reason = $validated['rejection_reason'];
            $record->save();

            return ApiResponse::success((new BusinessResource($record->load('requirements.skills')))->resolve($request), 'Business rejected.');
        }, 3);
    }
}

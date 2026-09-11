<?php

namespace App\Http\Controllers;

use App\Http\Requests\Businesses\ListBusinessesRequest;
use App\Http\Requests\Businesses\StoreBusinessRequest;
use App\Http\Requests\Businesses\UpdateBusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Http\Responses\ApiResponse;
use App\Models\Business;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class BusinessController extends Controller
{
    public function index(ListBusinessesRequest $request): JsonResponse
    {
        $page = $request->user()->founderProfile->businesses()->with('requirements.skills')
            ->orderByDesc('id')->paginate((int) $request->validated('per_page', 15));

        return ApiResponse::success([
            'items' => BusinessResource::collection($page->getCollection())->resolve($request),
            'pagination' => ['current_page' => $page->currentPage(), 'per_page' => $page->perPage(),
                'total' => $page->total(), 'last_page' => $page->lastPage()],
        ]);
    }

    public function store(StoreBusinessRequest $request): JsonResponse
    {
        Gate::authorize('create', Business::class);

        return DB::transaction(function () use ($request) {
            $business = $request->user()->founderProfile->businesses()->create($request->validated());
            $business->requirements()->create();

            return ApiResponse::success((new BusinessResource($business->load('requirements.skills')))->resolve($request), 'Business draft created.', 201);
        }, 3);
    }

    public function show(Request $request, string $business): JsonResponse
    {
        Gate::authorize('viewAny', Business::class);
        $owned = $request->user()->founderProfile->businesses()->findOrFail($business);
        Gate::authorize('view', $owned);

        return ApiResponse::success((new BusinessResource($owned->load('requirements.skills')))->resolve($request));
    }

    public function update(UpdateBusinessRequest $request, string $business): JsonResponse
    {
        return DB::transaction(function () use ($request, $business) {
            $owned = $request->user()->founderProfile->businesses()->lockForUpdate()->findOrFail($business);
            Gate::authorize('update', $owned);
            $owned->fill($request->validated())->save();

            return ApiResponse::success((new BusinessResource($owned->load('requirements.skills')))->resolve($request), 'Business updated.');
        }, 3);
    }
}

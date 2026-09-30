<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VerificationRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Mockery;
use Tests\TestCase;

// No database traits or fixtures: these checks also run when the test DB is offline.
class AdminAuditAuthorizationTest extends TestCase
{
    public function test_both_audit_routes_use_the_existing_admin_middleware(): void
    {
        foreach (['verification-requests/{verification_request}', 'financial-reports/{report}'] as $resource) {
            $route = collect(Route::getRoutes())->first(fn ($route) => $route->uri() === "api/admin/$resource/audit-logs");
            $this->assertNotNull($route);
            $this->assertContains('auth:sanctum', $route->gatherMiddleware());
            $this->assertContains('admin', $route->gatherMiddleware());
            $this->assertContains('GET', $route->methods());
        }
    }

    public function test_guests_and_non_admins_are_denied_before_record_queries(): void
    {
        foreach (['verification-requests', 'financial-reports'] as $resource) {
            $this->getJson("/api/admin/$resource/1/audit-logs")->assertUnauthorized();
        }
        $user = Mockery::mock(User::class)->makePartial();
        $user->shouldReceive('hasAdminAccess')->andReturn(false);
        $this->actingAs($user, 'web');
        foreach (['verification-requests', 'financial-reports'] as $resource) {
            $this->getJson("/api/admin/$resource/1/audit-logs")->assertForbidden();
        }
        $this->assertFalse(Gate::forUser($user)->allows('viewAnyAdmin', VerificationRequest::class));
    }
}

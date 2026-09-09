<?php

namespace Tests\Feature;

use App\Http\Responses\ApiResponse;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\Fixtures\FoundationRequest;
use Tests\TestCase;

class ApiFoundationTest extends TestCase
{
    public function test_health_route_returns_success_without_accept_header(): void
    {
        $this->get('/api/health')->assertOk()->assertHeader('Content-Type', 'application/json')
            ->assertExactJson(['success' => true, 'message' => 'Success.', 'data' => ['status' => 'ok']]);
    }

    public function test_form_request_returns_only_validated_data_with_created_status(): void
    {
        Route::post('/api/_test/validate', fn (FoundationRequest $request) =>
            ApiResponse::success($request->validated(), 'Created.', 201));

        $this->postJson('/api/_test/validate', ['label' => 'Example', 'extra' => 'ignored'])
            ->assertCreated()->assertExactJson([
                'success' => true, 'message' => 'Created.', 'data' => ['label' => 'Example'],
            ]);
    }

    public function test_validation_errors_are_json_even_when_html_is_requested(): void
    {
        Route::post('/api/_test/validate', fn (FoundationRequest $request) =>
            ApiResponse::success($request->validated()));

        $this->post('/api/_test/validate', [], ['Accept' => 'text/html'])
            ->assertUnprocessable()->assertExactJson([
                'success' => false,
                'message' => 'The given data was invalid.',
                'error' => ['code' => 'VALIDATION_ERROR', 'details' => ['label' => ['The label field is required.']]],
            ]);
    }

    public function test_unknown_api_route_has_consistent_error(): void
    {
        $response = $this->get('/api/missing')->assertNotFound()->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Not Found')->assertJsonPath('error.code', 'HTTP_404');
        $this->assertIsObject(json_decode($response->getContent())->error->details);
        $this->get('/api')->assertNotFound()->assertJsonPath('error.code', 'HTTP_404');
    }

    public function test_method_not_allowed_preserves_allow_header(): void
    {
        $this->post('/api/health')->assertStatus(405)->assertHeader('Allow', 'GET, HEAD')
            ->assertJsonPath('error.code', 'HTTP_405');
    }

    public function test_rate_limit_preserves_retry_after(): void
    {
        Route::get('/api/_test/limited', fn () => abort(429, 'Internal context', ['Retry-After' => '60']));
        $this->get('/api/_test/limited')->assertStatus(429)->assertHeader('Retry-After', '60')
            ->assertJsonPath('message', 'Too Many Requests')->assertJsonPath('error.code', 'HTTP_429');
    }

    public function test_server_errors_do_not_expose_exception_details_in_debug_mode(): void
    {
        config(['app.debug' => true, 'logging.default' => 'null']);
        Route::get('/api/_test/error', fn () => throw new RuntimeException('PRIVATE_DATABASE_DETAIL'));
        $this->get('/api/_test/error')->assertStatus(500)
            ->assertJsonPath('message', 'Internal Server Error')->assertJsonPath('error.code', 'HTTP_500')
            ->assertDontSee('PRIVATE_DATABASE_DETAIL')->assertJsonMissingPath('trace');
    }

    public function test_web_routes_keep_html_behavior(): void
    {
        $this->get('/')->assertOk()->assertHeader('Content-Type', 'text/html; charset=utf-8');
        $this->get('/missing-web-route', ['Accept' => 'text/html'])->assertNotFound()
            ->assertHeader('Content-Type', 'text/html; charset=utf-8');
    }

    public function test_cors_allows_only_the_configured_origin(): void
    {
        // Deliberately a test fixture, not an assumption about the real frontend.
        config(['cors.allowed_origins' => ['https://frontend.example.test']]);
        $this->get('/api/health', ['Origin' => 'https://frontend.example.test'])->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'https://frontend.example.test')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
        $this->get('/api/health', ['Origin' => 'https://untrusted.example.test'])->assertOk()
            // Laravel emits its single configured origin; browsers reject the mismatch.
            ->assertHeader('Access-Control-Allow-Origin', 'https://frontend.example.test');
    }

    public function test_cors_preflight_and_empty_configuration(): void
    {
        config(['cors.allowed_origins' => ['https://frontend.example.test']]);
        $this->options('/api/health', [], [
            'Origin' => 'https://frontend.example.test',
            'Access-Control-Request-Method' => 'GET',
            'Access-Control-Request-Headers' => 'Content-Type',
        ])->assertNoContent()->assertHeader('Access-Control-Allow-Origin', 'https://frontend.example.test');

        config(['cors.allowed_origins' => []]);
        $this->get('/api/health', ['Origin' => 'https://frontend.example.test'])
            ->assertHeaderMissing('Access-Control-Allow-Origin');
    }
}

<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Fixtures\EnforcedCsrf;
use Tests\TestCase;

class BusinessRequirementDetailsTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private int $businessId;

    private string $endpoint;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->unverified()->create();
        $this->actingAs($this->owner, 'web')->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        $this->businessId = $this->postJson('/api/me/businesses', ['name' => 'Example'])->assertCreated()->json('data.id');
        $this->endpoint = "/api/me/businesses/{$this->businessId}/requirements";
    }

    public static function modes(): array
    {
        return [[[]], [['micro']], [['large_standard']], [['micro', 'large_standard']]];
    }

    #[DataProvider('modes')]
    public function test_accepted_modes_do_not_classify_or_require_funding(array $modes): void
    {
        $this->patchJson($this->endpoint, ['accepted_investment_types' => $modes])->assertOk()
            ->assertJsonPath('data.accepted_investment_types', $modes)->assertJsonPath('data.funding_amount', null);
        $this->patchJson($this->endpoint, ['funding_amount' => '0'])->assertOk()
            ->assertJsonPath('data.accepted_investment_types', $modes)->assertJsonPath('data.funding_amount', '0.00');
    }

    public function test_details_round_trip_and_nullable_fields_clear_without_losing_omitted_values(): void
    {
        $input = [
            'accepted_investment_types' => ['micro', 'large_standard'],
            'micro_proposed_terms' => 'Discuss profit/loss sharing.',
            'large_standard_proposed_terms' => 'Discuss ownership terms.',
            'required_experience_level' => 'Experienced', 'required_availability' => 'Part time',
            'compensation_preferences' => ['salary', 'equity'],
        ];
        $this->patchJson($this->endpoint, $input)->assertOk()->assertJsonFragment($input);
        $this->getJson("/api/me/businesses/{$this->businessId}")->assertOk()
            ->assertJsonPath('data.requirements.micro_proposed_terms', $input['micro_proposed_terms']);
        $this->getJson('/api/me/businesses')->assertOk()
            ->assertJsonPath('data.items.0.requirements.compensation_preferences', ['salary', 'equity']);
        $this->patchJson($this->endpoint, ['required_availability' => null, 'compensation_preferences' => []])
            ->assertOk()->assertJsonPath('data.required_availability', null)
            ->assertJsonPath('data.required_experience_level', 'Experienced')
            ->assertJsonPath('data.compensation_preferences', []);
        $this->patchJson($this->endpoint, ['required_experience_level' => null])->assertOk()
            ->assertJsonPath('data.required_experience_level', null);
    }

    public function test_merged_validation_rejects_removal_and_allows_explicit_clear_atomically(): void
    {
        $this->patchJson($this->endpoint, [
            'accepted_investment_types' => ['micro', 'large_standard'],
            'micro_proposed_terms' => 'Micro proposal', 'large_standard_proposed_terms' => 'Standard proposal',
            'funding_amount' => '123.45', 'skills' => ['PHP'],
        ])->assertOk();
        $this->patchJson($this->endpoint, [
            'accepted_investment_types' => [], 'funding_amount' => '999.99', 'skills' => ['New skill'],
            'required_availability' => 'Full time',
        ])->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR')
            ->assertJsonValidationErrors(['micro_proposed_terms', 'large_standard_proposed_terms'], 'error.details');
        $record = Business::findOrFail($this->businessId)->requirements;
        $this->assertSame('123.45', $record->funding_amount);
        $this->assertSame(['micro', 'large_standard'], $record->accepted_investment_types);
        $this->assertNull($record->required_availability);
        $this->assertSame(['PHP'], $record->skills->pluck('name')->all());
        $this->assertDatabaseMissing('skills', ['normalized_name' => 'new skill']);
        $this->patchJson($this->endpoint, ['micro_proposed_terms' => 'Updated proposal'])->assertOk();
        $this->patchJson($this->endpoint, ['accepted_investment_types' => ['large_standard'], 'micro_proposed_terms' => null])
            ->assertOk()->assertJsonPath('data.micro_proposed_terms', null)
            ->assertJsonPath('data.large_standard_proposed_terms', 'Standard proposal');
        $this->patchJson($this->endpoint, ['accepted_investment_types' => [], 'large_standard_proposed_terms' => null])
            ->assertOk()->assertJsonPath('data.accepted_investment_types', []);
    }

    public static function invalidDetails(): array
    {
        return [
            [['accepted_investment_types' => ['unknown']]],
            [['accepted_investment_types' => ['micro', 'micro']]],
            [['accepted_investment_types' => null]],
            [['accepted_investment_types' => ['first' => 'micro']]],
            [['accepted_investment_types' => [['micro']]]],
            [['micro_proposed_terms' => 'No selected mode']],
            [['large_standard_proposed_terms' => 'No selected mode']],
            [['micro_proposed_terms' => str_repeat('x', 5001)]],
            [['large_standard_proposed_terms' => []]],
            [['required_experience_level' => str_repeat('x', 101)]],
            [['required_availability' => []]],
            [['compensation_preferences' => ['salary', 'salary']]],
            [['compensation_preferences' => ['profit_share']]],
            [['compensation_preferences' => null]],
            [['compensation_preferences' => ['first' => 'salary']]],
            [['business_id' => 999]],
            [['owner_id' => 999]],
            [['is_admin' => true]],
            [['valuation' => '100000']],
        ];
    }

    #[DataProvider('invalidDetails')]
    public function test_invalid_details_do_not_persist(array $input): void
    {
        $this->patchJson($this->endpoint, $input)->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->assertNull(Business::findOrFail($this->businessId)->requirements->micro_proposed_terms);
    }

    public function test_null_storage_serializes_empty_arrays_and_maximum_lengths_are_valid(): void
    {
        $record = Business::findOrFail($this->businessId)->requirements;
        $this->assertNull($record->accepted_investment_types);
        $this->assertNull($record->compensation_preferences);
        $this->patchJson($this->endpoint, [])->assertOk()->assertJsonPath('data.accepted_investment_types', [])
            ->assertJsonPath('data.compensation_preferences', []);
        $this->patchJson($this->endpoint, [
            'accepted_investment_types' => ['micro', 'large_standard'],
            'micro_proposed_terms' => str_repeat('x', 5000), 'large_standard_proposed_terms' => str_repeat('y', 5000),
            'required_experience_level' => str_repeat('x', 100), 'required_availability' => str_repeat('x', 100),
        ])->assertOk();
    }

    public function test_details_roll_back_if_later_skill_write_fails(): void
    {
        config(['logging.default' => 'null']);
        DB::listen(function ($query) {
            if (str_starts_with($query->sql, 'insert into '.chr(96).'skills'.chr(96))) {
                throw new \RuntimeException('Test-only skill failure.');
            }
        });
        $this->patchJson($this->endpoint, [
            'accepted_investment_types' => ['micro'], 'micro_proposed_terms' => 'Proposal',
            'funding_amount' => '10.01', 'skills' => ['PHP'],
        ])->assertStatus(500);
        $record = Business::findOrFail($this->businessId)->requirements;
        $this->assertNull($record->accepted_investment_types);
        $this->assertNull($record->micro_proposed_terms);
        $this->assertNull($record->funding_amount);
        $this->assertDatabaseCount('skills', 0);
    }

    public function test_new_fields_preserve_owner_admin_and_csrf_boundaries(): void
    {
        config(['sanctum.middleware.validate_csrf_token' => EnforcedCsrf::class]);
        $this->patchJson($this->endpoint, ['accepted_investment_types' => ['micro']])->assertStatus(419);
        config(['sanctum.middleware.validate_csrf_token' => ValidateCsrfToken::class]);
        $other = User::factory()->create();
        DB::table('admin_access')->insert(['user_id' => $other->id]);
        $this->app['auth']->forgetGuards();
        $this->actingAs($other, 'web');
        $this->patchJson($this->endpoint, ['required_availability' => 'Part time'])->assertForbidden();
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
        $this->patchJson($this->endpoint, ['required_availability' => 'Part time'])->assertNotFound();
        $this->assertNull(Business::findOrFail($this->businessId)->requirements->required_availability);
    }
}

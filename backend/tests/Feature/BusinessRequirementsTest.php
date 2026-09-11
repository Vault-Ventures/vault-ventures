<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class BusinessRequirementsTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->unverified()->create();
        $this->actingAs($this->owner, 'web')->withCredentials()->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertCreated();
    }

    private function draft(array $fields = []): int
    {
        return $this->postJson('/api/me/businesses', array_replace(['name' => 'Test business'], $fields))->assertCreated()->json('data.id');
    }

    public function test_amount_precision_and_shared_skill_isolation_with_patch_semantics(): void
    {
        $this->postJson('/api/me/roles', ['role' => 'professional'])->assertCreated();
        $this->patchJson('/api/me/profiles/professional', ['skills' => ['PHP']])->assertOk();
        $id = $this->draft();
        $other = $this->draft();
        $this->patchJson("/api/me/businesses/$id/requirements", ['funding_amount' => '9999999999999.99', 'skills' => ['php', ' PHP ', 'Data   Analysis']])
            ->assertOk()->assertJsonPath('data.funding_amount', '9999999999999.99')->assertJsonPath('data.skills', ['Data Analysis', 'PHP']);
        $this->patchJson("/api/me/businesses/$other/requirements", ['skills' => ['php']])->assertOk()->assertJsonPath('data.skills', ['PHP']);
        $this->patchJson("/api/me/businesses/$id/requirements", ['funding_amount' => null])->assertOk()
            ->assertJsonPath('data.funding_amount', null)->assertJsonPath('data.skills', ['Data Analysis', 'PHP']);
        $this->patchJson("/api/me/businesses/$id/requirements", ['skills' => []])->assertOk()->assertJsonPath('data.skills', []);
        $this->assertDatabaseCount('skills', 2);
        $this->assertDatabaseCount('professional_profile_skill', 1);
        $this->assertDatabaseCount('business_requirement_skill', 1);
        $this->getJson('/api/me/profile')->assertJsonPath('data.profiles.professional.skills', ['PHP']);
        $this->getJson("/api/me/businesses/$other")->assertJsonPath('data.requirements.skills', ['PHP']);
        $this->patchJson("/api/me/businesses/$id/requirements", ['funding_amount' => 0])->assertOk()->assertJsonPath('data.funding_amount', '0.00');
        $this->patchJson("/api/me/businesses/$id/requirements", [])->assertOk()->assertJsonPath('data.funding_amount', '0.00');
    }

    public static function invalidRequirements(): array
    {
        return [
            'negative' => [['funding_amount' => '-1']], 'overflow' => [['funding_amount' => '10000000000000']],
            'precision' => [['funding_amount' => '1.001']], 'exponent' => [['funding_amount' => '1e3']],
            'boolean' => [['funding_amount' => true]], 'null skills' => [['skills' => null]],
            'object skills' => [['skills' => ['a' => 'PHP']]], 'nested skills' => [['skills' => [['name' => 'PHP']]]],
            'blank skill' => [['skills' => ["\u{00A0}"]]], 'id skill' => [['skills' => [1]]],
            'count' => [['skills' => array_fill(0, 51, 'PHP')]], 'length' => [['skills' => [str_repeat('x', 101)]]],
            'owner' => [['business_id' => 99]], 'currency' => [['currency' => 'USD']],
            'investment terms' => [['equity_percentage' => 10]],
        ];
    }

    #[DataProvider('invalidRequirements')]
    public function test_invalid_requirements_do_not_write(array $input): void
    {
        $id = $this->draft();
        $this->patchJson("/api/me/businesses/$id/requirements", $input)->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->getJson("/api/me/businesses/$id")->assertJsonPath('data.requirements', [
            'funding_amount' => null, 'skills' => [], 'accepted_investment_types' => [],
            'micro_proposed_terms' => null, 'large_standard_proposed_terms' => null,
            'required_experience_level' => null, 'required_availability' => null,
            'compensation_preferences' => [],
        ]);
        $this->assertDatabaseCount('skills', 0);
    }

    public function test_requirement_unique_business_constraint(): void
    {
        $id = $this->draft();
        $this->expectException(QueryException::class);
        DB::table('business_requirements')->insert(['business_id' => $id]);
    }

    public function test_pivot_unique_constraint(): void
    {
        $id = $this->draft();
        $this->patchJson("/api/me/businesses/$id/requirements", ['skills' => ['PHP']])->assertOk();
        $pair = (array) DB::table('business_requirement_skill')->first();
        $this->expectException(QueryException::class);
        DB::table('business_requirement_skill')->insert($pair);
    }

    public function test_pivot_foreign_key_constraint(): void
    {
        $id = $this->draft();
        $this->expectException(QueryException::class);
        DB::table('business_requirement_skill')->insert(['business_requirement_id' => Business::find($id)->requirements->id, 'skill_id' => 9999999]);
    }

    public function test_requirements_update_rolls_back_on_skill_insert_failure(): void
    {
        $id = $this->draft();
        config(['logging.default' => 'null']);
        DB::listen(function ($query) {
            if (str_starts_with($query->sql, 'insert into '.chr(96).'skills'.chr(96))) {
                throw new \RuntimeException('Test failure');
            }
        });
        $this->patchJson("/api/me/businesses/$id/requirements", ['funding_amount' => '10', 'skills' => ['PHP']])->assertStatus(500);
        $this->assertNull(Business::find($id)->requirements->funding_amount);
        $this->assertDatabaseCount('skills', 0);
    }
}

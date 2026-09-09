<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProfileDataTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->unverified()->create();
        $this->actingAs($this->owner, 'web')->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function enroll(string $role): void
    {
        $this->postJson('/api/me/roles', ['role' => $role])->assertCreated();
    }

    public function test_investor_preferences_round_trip_with_exact_decimal_strings(): void
    {
        $this->enroll('investor');
        $input = [
            'available_investment' => '1234567890123.45', 'minimum_investment' => '10000.01',
            'maximum_investment' => '50000.99', 'industry' => 'Technology', 'risk_level' => 'Moderate',
            'business_stage' => 'Early stage', 'location' => 'Dhaka', 'involvement' => 'Advisory',
            'investment_types' => ['micro', 'large_standard'],
        ];
        $this->patchJson('/api/me/investor-preferences', $input)->assertOk()->assertJsonPath('data', $input);
        $this->getJson('/api/me/investor-preferences')->assertOk()->assertJsonPath('data', $input);
        $this->getJson('/api/me/profile')->assertJsonPath('data.profiles.investor.preferences', $input);
    }

    public function test_investor_patch_checks_existing_bounds_without_losing_omitted_fields(): void
    {
        $this->enroll('investor');
        $this->patchJson('/api/me/investor-preferences', [
            'minimum_investment' => '100.01', 'maximum_investment' => '100.02', 'industry' => 'Technology',
        ])->assertOk();
        $this->patchJson('/api/me/investor-preferences', ['minimum_investment' => '100.03'])
            ->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->patchJson('/api/me/investor-preferences', ['maximum_investment' => '100.00'])->assertUnprocessable();
        $this->getJson('/api/me/investor-preferences')->assertJsonPath('data.minimum_investment', '100.01')
            ->assertJsonPath('data.maximum_investment', '100.02');
        $this->patchJson('/api/me/investor-preferences', ['minimum_investment' => null])->assertOk()
            ->assertJsonPath('data.minimum_investment', null)->assertJsonPath('data.industry', 'Technology');
    }

    public static function invalidPreferences(): array
    {
        return [
            'negative' => [['available_investment' => '-1']],
            'too precise' => [['minimum_investment' => '1.001']],
            'overflow' => [['maximum_investment' => '10000000000000.00']],
            'scientific notation' => [['available_investment' => '1e4']],
            'boolean amount' => [['available_investment' => true]],
            'bad range' => [['minimum_investment' => '2', 'maximum_investment' => '1']],
            'invalid type' => [['investment_types' => ['guaranteed_return']]],
            'duplicate types' => [['investment_types' => ['micro', 'micro']]],
            'null types' => [['investment_types' => null]],
            'object types' => [['investment_types' => ['first' => 'micro']]],
            'unknown field' => [['biography' => 'Not approved']],
            'protected field' => [['investor_profile_id' => 99]],
            'long industry' => [['industry' => str_repeat('x', 101)]],
        ];
    }

    #[DataProvider('invalidPreferences')]
    public function test_invalid_preferences_are_rejected(array $input): void
    {
        $this->enroll('investor');
        $this->patchJson('/api/me/investor-preferences', $input)->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->getJson('/api/me/investor-preferences')->assertJsonPath('data.available_investment', null)
            ->assertJsonPath('data.investment_types', []);
    }

    public function test_empty_drafts_and_zero_amounts_are_allowed_without_completion_gates(): void
    {
        $this->enroll('investor');
        $this->patchJson('/api/me/investor-preferences', [])->assertOk();
        $this->patchJson('/api/me/investor-preferences', [
            'available_investment' => 0, 'minimum_investment' => 0, 'maximum_investment' => 0,
        ])->assertOk()->assertJsonPath('data.available_investment', '0.00');
        $this->enroll('professional');
        $this->patchJson('/api/me/profiles/professional', [])->assertOk()
            ->assertJsonPath('data.compensation_preferences', [])->assertJsonMissingPath('data.completion_percentage');
    }

    public function test_professional_fields_and_skills_round_trip_and_normalize(): void
    {
        $this->enroll('professional');
        $this->patchJson('/api/me/profiles/professional', [
            'industry_experience' => ['Technology', 'Education'], 'experience_level' => 'Experienced',
            'availability' => 'Part time', 'location' => 'Dhaka',
            'compensation_preferences' => ['salary', 'equity'],
            'skills' => [' PHP ', 'php', 'Data   Analysis'],
        ])->assertOk()->assertJsonPath('data.skills', ['Data Analysis', 'PHP'])
            ->assertJsonPath('data.industry_experience', ['Technology', 'Education']);
        $this->assertDatabaseCount('skills', 2);
        $this->assertDatabaseCount('professional_profile_skill', 2);
        $this->getJson('/api/me/profile')->assertJsonPath('data.profiles.professional.location', 'Dhaka');
        $this->patchJson('/api/me/profiles/professional', ['availability' => null])->assertOk()
            ->assertJsonPath('data.skills', ['Data Analysis', 'PHP'])->assertJsonPath('data.location', 'Dhaka');
        $this->patchJson('/api/me/profiles/professional', ['skills' => []])->assertOk()->assertJsonPath('data.skills', []);
        $this->assertDatabaseCount('professional_profile_skill', 0);
        $this->assertDatabaseCount('skills', 2);
    }

    public function test_shared_skills_do_not_allow_one_user_to_change_another_profile(): void
    {
        $this->enroll('professional');
        $this->patchJson('/api/me/profiles/professional', ['skills' => ['PHP']])->assertOk();
        $other = User::factory()->create();
        $this->app['auth']->forgetGuards();
        $this->actingAs($other, 'web');
        $this->enroll('professional');
        $this->patchJson('/api/me/profiles/professional', ['skills' => ['php']])->assertOk()->assertJsonPath('data.skills', ['PHP']);
        $this->patchJson('/api/me/profiles/professional', ['skills' => []])->assertOk();
        $this->assertDatabaseCount('skills', 1);
        $this->assertDatabaseCount('professional_profile_skill', 1);
        $this->assertSame(['PHP'], $this->owner->professionalProfile->skills->pluck('name')->all());
    }

    public static function invalidProfessionalData(): array
    {
        return [
            'unapproved field' => [['avatar' => 'file.png']],
            'admin field' => [['is_admin' => true]],
            'verification' => [['verification_status' => 'verified']],
            'reputation' => [['reputation' => 100]],
            'completion' => [['completion_percentage' => 100]],
            'education' => [['education' => 'Degree']],
            'social links' => [['social_links' => []]],
            'skill id' => [['skills' => [1]]],
            'blank skill' => [['skills' => ["\u{00A0}"]]],
            'nested skill' => [['skills' => [['name' => 'PHP']]]],
            'skill length' => [['skills' => [str_repeat('a', 101)]]],
            'skill count' => [['skills' => array_fill(0, 51, 'PHP')]],
            'null skills' => [['skills' => null]],
            'compensation' => [['compensation_preferences' => ['profit_guarantee']]],
            'duplicate compensation' => [['compensation_preferences' => ['salary', 'salary']]],
            'industry object' => [['industry_experience' => ['industry' => 'Technology']]],
            'experience length' => [['experience_level' => str_repeat('x', 101)]],
            'location length' => [['location' => str_repeat('x', 256)]],
        ];
    }

    #[DataProvider('invalidProfessionalData')]
    public function test_professional_validation_rejects_unapproved_values(array $input): void
    {
        $this->enroll('professional');
        $this->patchJson('/api/me/profiles/professional', $input)->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->assertDatabaseCount('skills', 0);
        $this->assertDatabaseCount('professional_profile_skill', 0);
    }

    public function test_skill_join_uniqueness_is_enforced(): void
    {
        $this->enroll('professional');
        $this->patchJson('/api/me/profiles/professional', ['skills' => ['PHP']])->assertOk();
        $pair = (array) DB::table('professional_profile_skill')->first();
        $this->expectException(QueryException::class);
        DB::table('professional_profile_skill')->insert($pair);
    }
}

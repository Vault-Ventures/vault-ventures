<?php

namespace Tests\Feature;

use App\Enums\ParticipantRole;
use App\Models\AdminAccess;
use App\Models\InvestorPreference;
use App\Models\User;
use Illuminate\Database\Eloquent\MassAssignmentException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Fixtures\EnforcedCsrf;
use Tests\TestCase;

class RoleProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->owner = User::factory()->unverified()->create();
        $this->actingAs($this->owner, 'web')->withCredentials()
            ->withHeaders(['Origin' => 'http://localhost:8443', 'Accept' => 'application/json']);
    }

    private function enroll(string $role): void
    {
        $this->postJson('/api/me/roles', ['role' => $role])->assertCreated()->assertJsonPath('data.role', $role);
    }

    public function test_existing_account_has_no_fabricated_roles_or_profiles(): void
    {
        $this->getJson('/api/me/profile')->assertOk()->assertExactJson([
            'success' => true, 'message' => 'Success.',
            'data' => [
                'user' => [
                    'id' => $this->owner->id,
                    'name' => $this->owner->name,
                    'email' => $this->owner->email,
                    'headline' => null,
                    'bio' => null,
                    'location' => null,
                    'avatar_url' => null,
                    'cover_photo_url' => null,
                    'experience' => [],
                    'portfolio' => [],
                    'preferences' => [],
                ],
                'roles' => [],
                'profiles' => ['founder' => null, 'investor' => null, 'professional' => null],
            ],
        ]);
        foreach (['user_roles', 'admin_access', 'founder_profiles', 'investor_profiles', 'professional_profiles'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertFalse($this->owner->hasAdminAccess());
    }

    public function test_multi_role_enrollment_is_idempotent_and_does_not_assign_admin(): void
    {
        foreach (['founder', 'investor', 'professional'] as $role) {
            $this->enroll($role);
            $this->postJson('/api/me/roles', ['role' => $role])->assertOk()->assertJsonPath('message', 'Role already enrolled.');
        }
        $this->getJson('/api/me/profile')->assertOk()
            ->assertJsonPath('data.roles', ['founder', 'investor', 'professional'])
            ->assertJsonPath('data.profiles.investor.preferences.investment_types', [])
            ->assertJsonPath('data.profiles.professional.skills', []);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('user_roles', 3);
        foreach (['founder_profiles', 'investor_profiles', 'investor_preferences', 'professional_profiles'] as $table) {
            $this->assertDatabaseCount($table, 1);
        }
        $this->assertDatabaseCount('admin_access', 0);
        $this->assertTrue($this->owner->hasRole(ParticipantRole::Founder));
    }

    public function test_founder_profile_is_identity_only(): void
    {
        $this->enroll('founder');
        $this->assertSame(['id', 'user_id', 'created_at', 'updated_at'], Schema::getColumnListing('founder_profiles'));
        $this->getJson('/api/me/profile')->assertJsonPath('data.profiles.founder', [
            'id' => $this->owner->founderProfile->id, 'user_id' => $this->owner->id,
        ]);
        $this->patchJson('/api/me/profiles/founder', ['biography' => 'Not supported'])->assertNotFound();
    }

    public function test_enrollment_rolls_back_if_profile_creation_fails(): void
    {
        config(['logging.default' => 'null']);
        InvestorPreference::creating(fn () => throw new \RuntimeException('Test-only failure.'));
        $this->postJson('/api/me/roles', ['role' => 'investor'])->assertStatus(500);
        $this->assertDatabaseCount('user_roles', 0);
        $this->assertDatabaseCount('investor_profiles', 0);
        $this->assertDatabaseCount('investor_preferences', 0);
    }

    public static function invalidEnrollment(): array
    {
        return [
            'admin role' => [['role' => 'admin']],
            'unknown role' => [['role' => 'founder_admin']],
            'multiple in one request' => [['role' => ['founder', 'investor']]],
            'missing role' => [[]],
            'foreign owner' => [['role' => 'founder', 'user_id' => 999]],
            'admin field' => [['role' => 'founder', 'is_admin' => true]],
            'admin record' => [['role' => 'founder', 'admin_access' => true]],
        ];
    }

    #[DataProvider('invalidEnrollment')]
    public function test_enrollment_rejects_unapproved_input(array $input): void
    {
        $this->postJson('/api/me/roles', $input)->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_ERROR');
        $this->assertDatabaseCount('user_roles', 0);
        $this->assertDatabaseCount('admin_access', 0);
    }

    public function test_anonymous_requests_are_rejected(): void
    {
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/me/profile')->assertUnauthorized()->assertJsonPath('error.code', 'HTTP_401');
        $this->getJson('/api/me/investor-preferences')->assertUnauthorized();
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertUnauthorized();
        $this->patchJson('/api/me/profiles/professional', [])->assertUnauthorized();
        $this->patchJson('/api/me/investor-preferences', [])->assertUnauthorized();
    }

    public function test_required_role_membership_is_enforced(): void
    {
        $this->getJson('/api/me/investor-preferences')->assertForbidden();
        $this->patchJson('/api/me/investor-preferences', ['industry' => 'Technology'])->assertForbidden();
        $this->patchJson('/api/me/profiles/professional', ['location' => 'Dhaka'])->assertForbidden();
    }

    public function test_profiles_have_no_cross_user_policy_or_admin_bypass(): void
    {
        foreach (['founder', 'investor', 'professional'] as $role) {
            $this->enroll($role);
        }
        $other = User::factory()->create();
        $admin = new AdminAccess;
        $admin->user_id = $other->id; // Trusted test fixture only.
        $admin->save();
        $records = [
            $this->owner->founderProfile, $this->owner->investorProfile,
            $this->owner->professionalProfile, $this->owner->investorProfile->preferences,
        ];
        foreach ($records as $record) {
            $this->assertTrue(Gate::forUser($this->owner)->allows('view', $record));
            $this->assertTrue(Gate::forUser($this->owner)->allows('update', $record));
            $this->assertFalse(Gate::forUser($other)->allows('view', $record));
            $this->assertFalse(Gate::forUser($other)->allows('update', $record));
        }
        $this->assertTrue(Gate::forUser($other)->allows('viewAny', AdminAccess::class));
        $this->assertFalse(Gate::forUser($this->owner)->allows('viewAny', AdminAccess::class));
        $this->assertFalse(Gate::forUser($other)->allows('create', AdminAccess::class));
        $this->assertFalse(Gate::forUser($other)->allows('update', $admin));
        $this->assertFalse(Gate::forUser($other)->allows('delete', $admin));
    }

    public function test_admin_mass_assignment_is_blocked(): void
    {
        $this->expectException(MassAssignmentException::class);
        AdminAccess::create(['user_id' => $this->owner->id]);
    }

    public function test_registration_still_cannot_assign_roles_or_admin(): void
    {
        $this->app['auth']->guard('web')->logout();
        $this->postJson('/api/auth/register', [
            'name' => 'New Account', 'email' => 'new@example.test',
            'password' => 'ExampleStrong123!', 'password_confirmation' => 'ExampleStrong123!',
            'role' => 'admin', 'is_admin' => true, 'admin_access' => ['user_id' => $this->owner->id],
        ])->assertCreated()->assertJsonMissingPath('data.is_admin');
        $this->assertDatabaseCount('admin_access', 0);
        $this->assertDatabaseCount('user_roles', 0);
    }

    public function test_user_owned_models_cannot_be_reassigned_by_mass_assignment(): void
    {
        $this->enroll('professional');
        $profile = $this->owner->professionalProfile;
        $profile->fill(['user_id' => 999, 'verification_status' => 'verified', 'reputation' => 100]);
        $profile->save();
        $this->assertSame($this->owner->id, $profile->fresh()->user_id);
        $this->assertArrayNotHasKey('verification_status', $profile->getAttributes());
    }

    public function test_duplicate_role_is_blocked_by_database_constraint(): void
    {
        $this->enroll('founder');
        $this->expectException(QueryException::class);
        DB::table('user_roles')->insert(['user_id' => $this->owner->id, 'role' => 'founder']);
    }

    public function test_duplicate_profile_is_blocked_by_database_constraint(): void
    {
        $this->enroll('founder');
        $this->expectException(QueryException::class);
        DB::table('founder_profiles')->insert(['user_id' => $this->owner->id]);
    }

    public function test_profile_foreign_key_rejects_nonexistent_users(): void
    {
        $this->expectException(QueryException::class);
        DB::table('founder_profiles')->insert(['user_id' => 999999999]);
    }

    public function test_database_role_constraint_excludes_admin(): void
    {
        $this->expectException(QueryException::class);
        DB::table('user_roles')->insert(['user_id' => $this->owner->id, 'role' => 'admin']);
    }

    public function test_csrf_is_enforced_for_new_write_endpoints(): void
    {
        config(['sanctum.middleware.validate_csrf_token' => EnforcedCsrf::class]);
        $this->postJson('/api/me/roles', ['role' => 'founder'])->assertStatus(419);
        $this->patchJson('/api/me/investor-preferences', [])->assertStatus(419);
        $this->patchJson('/api/me/profiles/professional', [])->assertStatus(419);
        $this->assertDatabaseCount('user_roles', 0);
    }

    public function test_other_user_cannot_be_targeted_through_api_input(): void
    {
        $this->enroll('professional');
        $other = User::factory()->create();
        $this->patchJson('/api/me/profiles/professional', [
            'user_id' => $other->id, 'location' => 'Dhaka',
        ])->assertUnprocessable();
        $this->assertNull($this->owner->professionalProfile->location);
        $this->getJson('/api/me/profile?user_id='.$other->id)->assertJsonPath('data.user.id', $this->owner->id);
        $this->getJson('/api/profiles/'.$other->id)->assertNotFound();
        $this->postJson('/api/admin/access', ['user_id' => $other->id])->assertNotFound();
    }

    public function test_profile_routes_work_with_a_real_sanctum_session(): void
    {
        $this->app['auth']->guard('web')->logout();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/auth/login', ['email' => $this->owner->email, 'password' => 'password'])->assertOk();
        $this->withCookie(config('session.cookie'), $this->app['session']->driver()->getId());
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/me/profile')->assertOk()->assertJsonPath('data.user.id', $this->owner->id);
        $this->enroll('founder');
        $this->getJson('/api/auth/user')->assertOk()->assertJsonPath('data.id', $this->owner->id)
            ->assertJsonMissingPath('data.roles')->assertJsonMissingPath('data.admin_access');
    }
}

<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\MatchingInsight;
use App\Services\BusinessAnalysis\AnalysisFailure;
use App\Services\Matching\MatchingInsightResult;
use App\Services\Matching\MatchingInsightService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use LogicException;
use Tests\TestCase;

class MatchingInsightFoundationTest extends TestCase
{
    use RefreshDatabase;

    private function payload(string $role = 'investor', array $extra = []): array
    {
        $factors = $role === 'investor'
            ? ['industry', 'investment_range', 'business_stage', 'risk_level', 'location', 'involvement']
            : ['skills', 'industry_experience', 'experience_level', 'availability', 'location', 'compensation'];

        return $extra + [
            'counterparty_role' => $role,
            'summary' => 'The deterministic match shows useful compatibility with specific review points.',
            'factor_explanations' => array_map(fn (string $factor) => [
                'factor_key' => $factor,
                'explanation' => 'The factor is explained from the supplied deterministic result.',
                'confidence' => 0.8,
            ], $factors),
            'confidence' => 0.8,
            'strengths' => ['Clear alignment'],
            'weaknesses' => ['Some information needs review'],
            'opportunities' => ['Discuss next steps'],
            'risks' => ['Source information may be incomplete'],
            'recommendations' => ['Review the underlying profile'],
        ];
    }

    private function business(string $name = 'Alpha Ventures'): Business
    {
        $user = \App\Models\User::factory()->create();
        $profile = $user->founderProfile()->create();

        return $profile->businesses()->create([
            'name' => $name,
            'description' => 'Revenue and traction are early.',
            'industry' => 'Fintech',
            'business_stage' => 'Growth',
            'location' => 'Dhaka',
            'risk_level' => 'Moderate',
            'expected_involvement' => 'Advisory',
        ]);
    }

    private function context(Business $business, string $role = 'investor', int $candidateId = 42, array $changes = []): array
    {
        $base = [
            'counterparty_role' => $role,
            'candidate_id' => $candidateId,
            'profile' => $role === 'investor'
                ? ['industry' => 'Fintech', 'business_stage' => 'Growth', 'risk_level' => 'Moderate', 'location' => 'Dhaka', 'involvement' => 'Advisory', 'password' => 'secret', 'api_key' => 'key', 'otp' => '123456', 'government_id' => 'NID-123', 'verification_evidence' => ['document' => 'private'], 'deal_room_message' => 'private', 'nda_content' => 'private', 'milestone_evidence' => 'private']
                : ['industry_experience' => ['Fintech'], 'experience_level' => 'Senior', 'availability' => 'Full-Time', 'location' => 'Dhaka', 'skills' => ['Laravel'], 'private_email' => 'hidden@example.test', 'phone_verification_code' => '123456', 'passport_number' => 'P-123'],
            'match' => [
                'overall_score' => 80,
                'match_grade' => 'Strong Match',
                'summary_explanation' => 'Strong deterministic alignment.',
                'factors' => [['factor_key' => $role === 'investor' ? 'industry' : 'skills', 'score' => 1.0, 'weight' => 0.25, 'explanation' => 'Aligned']],
                'strongest_alignments' => [],
                'potential_gaps' => [],
            ],
        ];

        return array_replace_recursive($base, $changes);
    }

    public function test_valid_investor_and_professional_structured_outputs_are_accepted(): void
    {
        $investor = MatchingInsightResult::fromJson(json_encode($this->payload('investor'), JSON_THROW_ON_ERROR));
        $professional = MatchingInsightResult::fromJson(json_encode($this->payload('professional'), JSON_THROW_ON_ERROR));

        $this->assertSame('investor', $investor->counterpartyRole);
        $this->assertSame('professional', $professional->counterpartyRole);
    }

    public function test_unknown_top_level_output_field_is_rejected(): void
    {
        $this->expectException(AnalysisFailure::class);
        MatchingInsightResult::fromJson(json_encode($this->payload('investor', ['unexpected' => true]), JSON_THROW_ON_ERROR));
    }

    public function test_top_level_confidence_outside_zero_to_one_is_rejected(): void
    {
        $this->expectException(AnalysisFailure::class);
        MatchingInsightResult::fromJson(json_encode($this->payload('investor', ['confidence' => 1.1]), JSON_THROW_ON_ERROR));
    }

    /** @dataProvider forbiddenFieldProvider */
    public function test_forbidden_authoritative_fields_are_rejected(string $field): void
    {
        $this->expectException(AnalysisFailure::class);

        MatchingInsightResult::fromJson(json_encode($this->payload('investor', [$field => 1]), JSON_THROW_ON_ERROR));
    }

    public static function forbiddenFieldProvider(): array
    {
        return array_map(fn (string $field) => [$field], ['score', 'match_score', 'overall_score', 'adjusted_score', 'recommended_score', 'predicted_score', 'rank', 'ranking', 'rerank', 'eligibility_decision', 'approval_decision', 'verification_decision', 'investment_decision', 'connection_decision']);
    }

    /** @dataProvider malformedFactorProvider */
    public function test_malformed_factor_explanations_are_rejected(array $factorChanges): void
    {
        $this->expectException(AnalysisFailure::class);
        $payload = $this->payload('investor');
        $payload['factor_explanations'][0] = array_replace($payload['factor_explanations'][0], $factorChanges);
        MatchingInsightResult::fromJson(json_encode($payload, JSON_THROW_ON_ERROR));
    }

    public static function malformedFactorProvider(): array
    {
        return [
            'unknown nested field' => [['unexpected' => true]],
            'invalid confidence' => [['confidence' => 2]],
            'missing explanation' => [['explanation' => '']],
            'invalid factor identity' => [['factor_key' => 'not_a_factor']],
        ];
    }

    public function test_investor_and_professional_factor_identity_boundaries_are_enforced(): void
    {
        foreach (['investor' => 'skills', 'professional' => 'investment_range'] as $role => $invalidFactor) {
            $this->expectException(AnalysisFailure::class);
            $payload = $this->payload($role);
            $payload['factor_explanations'][0]['factor_key'] = $invalidFactor;
            MatchingInsightResult::fromJson(json_encode($payload, JSON_THROW_ON_ERROR));
        }
    }

    public function test_matching_snapshot_and_fingerprint_change_when_source_changes(): void
    {
        $business = $this->business();

        $service = app(MatchingInsightService::class);
        $snapshotA = $service->context($business, $this->context($business));
        $fingerprintA = $service->fingerprint($business, $snapshotA);

        $business->update(['description' => 'We have customer validation evidence and revenue in the last quarter.']);

        $snapshotB = $service->context($business, $this->context($business));
        $fingerprintB = $service->fingerprint($business, $snapshotB);

        $this->assertNotSame($fingerprintA, $fingerprintB);
        $this->assertSame(['formula_version', 'business', 'candidate', 'match'], array_keys($snapshotB));
        $this->assertArrayNotHasKey('password', $snapshotB['candidate']['profile']);
        $this->assertArrayNotHasKey('api_key', $snapshotB['candidate']['profile']);
        foreach (['password', 'api_key', 'otp', 'government_id', 'verification_evidence', 'deal_room_message', 'nda_content', 'milestone_evidence', 'private_email', 'phone_verification_code', 'passport_number'] as $sensitiveKey) {
            $this->assertFalse($this->containsKey($snapshotB, $sensitiveKey), $sensitiveKey.' must not enter the source snapshot');
        }
    }

    private function containsKey(array $value, string $needle): bool
    {
        foreach ($value as $key => $item) {
            if ($key === $needle || (is_array($item) && $this->containsKey($item, $needle))) {
                return true;
            }
        }

        return false;
    }

    public function test_matching_insights_are_append_only(): void
    {
        $user = \App\Models\User::factory()->create();
        $profile = $user->founderProfile()->create();

        $business = $profile->businesses()->create([
            'name' => 'Beta Ventures',
            'industry' => 'Fintech',
            'location' => 'Dhaka',
        ]);

        $insight = new MatchingInsight;
        $insight->forceFill([
            'business_id' => $business->id,
            'candidate_type' => 'investor',
            'candidate_id' => 7,
            'counterparty_role' => 'investor',
            'version' => 1,
            'formula_version' => MatchingInsightService::FORMULA_VERSION,
            'output_contract_version' => MatchingInsightService::OUTPUT_CONTRACT_VERSION,
            'source_snapshot' => ['business' => ['name' => 'Beta Ventures']],
            'source_fingerprint' => hash('sha256', json_encode(['business' => ['name' => 'Beta Ventures']], JSON_THROW_ON_ERROR)),
            'summary' => 'Candidate fit is good based on explicit criteria.',
            'factor_explanations' => [],
            'confidence' => 0.8,
            'strengths' => ['Good industry alignment'],
            'weaknesses' => [],
            'opportunities' => [],
            'risks' => [],
            'recommendations' => ['Review the profile details'],
            'generated_at' => now(),
        ]);
        $insight->save();

        $this->expectException(LogicException::class);
        $insight->forceFill(['summary' => 'Changed after creation.']);
        $insight->save();
    }

    public function test_delete_is_blocked_for_persisted_matching_insight(): void
    {
        $business = $this->business();
        [$insight] = app(MatchingInsightService::class)->persist(
            $business,
            $this->context($business),
            MatchingInsightResult::fromJson(json_encode($this->payload('investor'), JSON_THROW_ON_ERROR)),
        );

        $this->expectException(LogicException::class);
        $insight->delete();
    }

    public function test_persistence_versions_exact_match_history_and_preserves_history(): void
    {
        $service = app(MatchingInsightService::class);
        $businessA = $this->business('Business A');
        $businessB = $this->business('Business B');
        $result = MatchingInsightResult::fromJson(json_encode($this->payload('investor'), JSON_THROW_ON_ERROR));

        [$first, $created] = $service->persist($businessA, $this->context($businessA, 'investor', 42), $result);
        $this->assertTrue($created);
        $this->assertSame(1, $first->version);

        $businessA->update(['description' => 'Changed matching-relevant business context.']);
        [$second, $created] = $service->persist($businessA, $this->context($businessA, 'investor', 42), $result);
        $this->assertTrue($created);
        $this->assertSame(2, $second->version);
        $this->assertSame('The deterministic match shows useful compatibility with specific review points.', $first->fresh()->summary);

        [$otherCandidate] = $service->persist($businessA, $this->context($businessA, 'investor', 43), $result);
        [$otherRole] = $service->persist($businessA, $this->context($businessA, 'professional', 42), MatchingInsightResult::fromJson(json_encode($this->payload('professional'), JSON_THROW_ON_ERROR)));
        [$otherBusiness] = $service->persist($businessB, $this->context($businessB, 'investor', 42), $result);

        $this->assertSame(1, $otherCandidate->version);
        $this->assertSame(1, $otherRole->version);
        $this->assertSame(1, $otherBusiness->version);
        $this->assertCount(5, MatchingInsight::query()->get());

        [$reused, $created] = $service->persist($businessA, $this->context($businessA, 'investor', 42), $result);
        $this->assertFalse($created);
        $this->assertSame($second->id, $reused->id);
    }

    public function test_fingerprint_changes_for_each_matching_source_dimension_and_is_stable(): void
    {
        $business = $this->business();
        $service = app(MatchingInsightService::class);
        $base = $service->context($business, $this->context($business));
        $sameDataDifferentOrder = $base;
        $sameDataDifferentOrder['match'] = array_reverse($sameDataDifferentOrder['match'], true);
        $this->assertSame($service->fingerprint($business, $base), $service->fingerprint($business, $sameDataDifferentOrder));

        $cases = [
            'investor preference' => function (array &$context): void { $context['candidate']['profile']['industry'] = 'Healthcare'; },
            'professional field' => function (array &$context): void { $context['candidate']['profile']['experience_level'] = 'Lead'; },
            'factor breakdown' => function (array &$context): void { $context['match']['factors'][0]['score'] = 0.5; },
            'overall score' => function (array &$context): void { $context['match']['overall_score'] = 81; },
            'counterparty role' => function (array &$context): void { $context['candidate']['counterparty_role'] = 'professional'; },
            'formula version' => function (array &$context): void { $context['formula_version'] = 'matching-v2'; },
        ];

        foreach ($cases as $label => $change) {
            $changed = $base;
            $change($changed);
            $this->assertNotSame($service->fingerprint($business, $base), $service->fingerprint($business, $changed), $label);
        }
    }

    public function test_identity_fingerprint_and_storage_do_not_collapse_across_businesses_candidates_or_roles(): void
    {
        $service = app(MatchingInsightService::class);
        $businessA = $this->business('Business A');
        $businessB = $this->business('Business B');
        $contextA = $this->context($businessA, 'investor', 42);
        $result = MatchingInsightResult::fromJson(json_encode($this->payload('investor'), JSON_THROW_ON_ERROR));

        $this->assertNotSame($service->fingerprint($businessA, $contextA), $service->fingerprint($businessB, $this->context($businessB, 'investor', 42)));
        $this->assertNotSame($service->fingerprint($businessA, $contextA), $service->fingerprint($businessA, $this->context($businessA, 'investor', 43)));
        $this->assertNotSame($service->fingerprint($businessA, $contextA), $service->fingerprint($businessA, $this->context($businessA, 'professional', 42)));

        $service->persist($businessA, $contextA, $result);
        $service->persist($businessB, $this->context($businessB, 'investor', 42), $result);
        $service->persist($businessA, $this->context($businessA, 'investor', 43), $result);
        $this->assertCount(3, MatchingInsight::query()->get());
    }

    public function test_matching_insight_schema_contains_only_the_new_foundation_structure(): void
    {
        $columns = Schema::getColumnListing('matching_insights');
        $this->assertSame([
            'id', 'business_id', 'candidate_type', 'candidate_id', 'counterparty_role', 'version',
            'formula_version', 'output_contract_version', 'source_snapshot', 'source_fingerprint',
            'summary', 'factor_explanations', 'confidence', 'strengths', 'weaknesses', 'opportunities',
            'risks', 'recommendations', 'generated_at', 'created_at',
        ], $columns);
        $this->assertContains('source_snapshot', $columns);
        $this->assertContains('source_fingerprint', $columns);
        $this->assertContains('generated_at', $columns);
    }
}

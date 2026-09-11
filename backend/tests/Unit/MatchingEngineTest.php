<?php

namespace Tests\Unit;

use App\Services\Matching\BusinessInvestorMatcher;
use App\Services\Matching\BusinessProfessionalMatcher;
use App\Services\Matching\Data\MatchFactorResult;
use App\Services\Matching\Data\MatchResult;
use PHPUnit\Framework\TestCase;

class MatchingEngineTest extends TestCase
{
    private BusinessInvestorMatcher $investorMatcher;

    private BusinessProfessionalMatcher $professionalMatcher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->investorMatcher = new BusinessInvestorMatcher;
        $this->professionalMatcher = new BusinessProfessionalMatcher;
    }

    // ==========================================
    // 1. WEIGHTS AND AGGREGATES
    // ==========================================

    public function test_investor_matching_weights_sum_to_one_hundred_percent(): void
    {
        $sum = BusinessInvestorMatcher::WEIGHT_INDUSTRY
            + BusinessInvestorMatcher::WEIGHT_INVESTMENT_RANGE
            + BusinessInvestorMatcher::WEIGHT_BUSINESS_STAGE
            + BusinessInvestorMatcher::WEIGHT_RISK_LEVEL
            + BusinessInvestorMatcher::WEIGHT_LOCATION
            + BusinessInvestorMatcher::WEIGHT_INVOLVEMENT;

        $this->assertSame(0.25, BusinessInvestorMatcher::WEIGHT_INDUSTRY);
        $this->assertSame(0.25, BusinessInvestorMatcher::WEIGHT_INVESTMENT_RANGE);
        $this->assertSame(0.15, BusinessInvestorMatcher::WEIGHT_BUSINESS_STAGE);
        $this->assertSame(0.15, BusinessInvestorMatcher::WEIGHT_RISK_LEVEL);
        $this->assertSame(0.10, BusinessInvestorMatcher::WEIGHT_LOCATION);
        $this->assertSame(0.10, BusinessInvestorMatcher::WEIGHT_INVOLVEMENT);
        $this->assertEqualsWithDelta(1.00, $sum, 0.0001);
    }

    public function test_professional_matching_weights_sum_to_one_hundred_percent(): void
    {
        $sum = BusinessProfessionalMatcher::WEIGHT_SKILL_OVERLAP
            + BusinessProfessionalMatcher::WEIGHT_INDUSTRY_EXPERIENCE
            + BusinessProfessionalMatcher::WEIGHT_EXPERIENCE_LEVEL
            + BusinessProfessionalMatcher::WEIGHT_AVAILABILITY
            + BusinessProfessionalMatcher::WEIGHT_LOCATION
            + BusinessProfessionalMatcher::WEIGHT_COMPENSATION;

        $this->assertSame(0.35, BusinessProfessionalMatcher::WEIGHT_SKILL_OVERLAP);
        $this->assertSame(0.20, BusinessProfessionalMatcher::WEIGHT_INDUSTRY_EXPERIENCE);
        $this->assertSame(0.15, BusinessProfessionalMatcher::WEIGHT_EXPERIENCE_LEVEL);
        $this->assertSame(0.15, BusinessProfessionalMatcher::WEIGHT_AVAILABILITY);
        $this->assertSame(0.10, BusinessProfessionalMatcher::WEIGHT_LOCATION);
        $this->assertSame(0.05, BusinessProfessionalMatcher::WEIGHT_COMPENSATION);
        $this->assertEqualsWithDelta(1.00, $sum, 0.0001);
    }

    // ==========================================
    // 2. INVESTOR FACTOR BRANCH TESTS
    // ==========================================

    public function test_investor_industry_scoring_branches(): void
    {
        // Exact match -> 1.0
        $f1 = $this->investorMatcher->evaluateIndustry('FinTech', 'FinTech');
        $this->assertSame(1.0, $f1->score);
        $this->assertStringContainsString('Both parties are focused on FinTech', $f1->explanation);

        // Case-insensitive exact match -> 1.0
        $f2 = $this->investorMatcher->evaluateIndustry('healthcare', 'HealthCare');
        $this->assertSame(1.0, $f2->score);

        // Investor open / unconstrained -> 0.75
        $f3 = $this->investorMatcher->evaluateIndustry('FinTech', null);
        $this->assertSame(0.75, $f3->score);

        $f4 = $this->investorMatcher->evaluateIndustry('FinTech', 'Any');
        $this->assertSame(0.75, $f4->score);

        // Mismatch -> 0.0
        $f5 = $this->investorMatcher->evaluateIndustry('Agriculture', 'FinTech');
        $this->assertSame(0.0, $f5->score);
        $this->assertStringContainsString('differs from investor preference', $f5->explanation);

        // Missing business industry -> 0.50
        $f6 = $this->investorMatcher->evaluateIndustry(null, 'FinTech');
        $this->assertSame(0.50, $f6->score);
    }

    public function test_investor_investment_range_bdt_decimal_scoring_branches(): void
    {
        // Target within min/max -> 1.0
        $f1 = $this->investorMatcher->evaluateInvestmentRange('500000.00', '100000.00', '1000000.00', null);
        $this->assertSame(1.0, $f1->score);
        $this->assertStringContainsString('৳500,000.00 is within investor range (৳100,000.00 - ৳1,000,000.00)', $f1->explanation);

        // Exact boundaries -> 1.0
        $f1Min = $this->investorMatcher->evaluateInvestmentRange('100000.00', '100000.00', '1000000.00', null);
        $this->assertSame(1.0, $f1Min->score);
        $f1Max = $this->investorMatcher->evaluateInvestmentRange('1000000.00', '100000.00', '1000000.00', null);
        $this->assertSame(1.0, $f1Max->score);

        // Below minimum -> proportional penalty capped at 0.75
        // e.g. min = 100000, target = 80000: diff = 20000, ratio = 0.2, score = 0.8 -> capped at 0.75
        $f2 = $this->investorMatcher->evaluateInvestmentRange('80000.00', '100000.00', '1000000.00', null);
        $this->assertSame(0.75, $f2->score);
        $this->assertStringContainsString('below investor minimum of ৳100,000.00', $f2->explanation);

        // Significantly below minimum: min = 100000, target = 20000: ratio = 0.8, score = 0.20
        $f2Low = $this->investorMatcher->evaluateInvestmentRange('20000.00', '100000.00', '1000000.00', null);
        $this->assertSame(0.20, $f2Low->score);

        // Above maximum -> proportional penalty capped at 0.75
        // e.g. max = 1000000, target = 1100000: diff = 100000, ratio = 0.0909, score = 0.9091 -> capped at 0.75
        $f3 = $this->investorMatcher->evaluateInvestmentRange('1100000.00', '100000.00', '1000000.00', null);
        $this->assertSame(0.75, $f3->score);
        $this->assertStringContainsString('exceeds investor maximum of ৳1,000,000.00', $f3->explanation);

        // Far above maximum: max = 1000000, target = 2000000: ratio = 0.5, score = 0.50
        $f3High = $this->investorMatcher->evaluateInvestmentRange('2000000.00', '100000.00', '1000000.00', null);
        $this->assertSame(0.50, $f3High->score);

        // Target <= available capital when only available capital applies -> 1.0
        $f4 = $this->investorMatcher->evaluateInvestmentRange('500000.00', null, null, '1000000.00');
        $this->assertSame(1.0, $f4->score);
        $this->assertStringContainsString('fully within available capital of ৳1,000,000.00', $f4->explanation);

        // Target > available capital: available = 400000, target = 800000 -> score = 0.50
        $f5 = $this->investorMatcher->evaluateInvestmentRange('800000.00', null, null, '400000.00');
        $this->assertSame(0.50, $f5->score);

        // Unconstrained investor range -> 0.75
        $f6 = $this->investorMatcher->evaluateInvestmentRange('500000.00', null, null, null);
        $this->assertSame(0.75, $f6->score);

        // Missing business funding amount -> 0.50
        $f7 = $this->investorMatcher->evaluateInvestmentRange(null, '100000.00', '1000000.00', null);
        $this->assertSame(0.50, $f7->score);
    }

    public function test_investor_business_stage_scoring_branches(): void
    {
        // Exact match -> 1.0
        $f1 = $this->investorMatcher->evaluateBusinessStage('Early stage', 'Early stage');
        $this->assertSame(1.0, $f1->score);

        // Investor open / unconstrained -> 0.75
        $f2 = $this->investorMatcher->evaluateBusinessStage('Growth', null);
        $this->assertSame(0.75, $f2->score);

        $f3 = $this->investorMatcher->evaluateBusinessStage('Growth', 'All');
        $this->assertSame(0.75, $f3->score);

        // Mismatch -> 0.0
        $f4 = $this->investorMatcher->evaluateBusinessStage('Idea', 'Growth');
        $this->assertSame(0.0, $f4->score);

        // Missing business stage -> 0.50
        $f5 = $this->investorMatcher->evaluateBusinessStage(null, 'Growth');
        $this->assertSame(0.50, $f5->score);
    }

    public function test_investor_risk_compatibility_hierarchy(): void
    {
        // Business risk <= investor tolerance -> 1.0
        $this->assertSame(1.0, $this->investorMatcher->evaluateRiskLevel('Low', 'Low')->score);
        $this->assertSame(1.0, $this->investorMatcher->evaluateRiskLevel('Moderate', 'Moderate')->score);
        $this->assertSame(1.0, $this->investorMatcher->evaluateRiskLevel('High', 'High')->score);
        $this->assertSame(1.0, $this->investorMatcher->evaluateRiskLevel('Low', 'Moderate')->score);
        $this->assertSame(1.0, $this->investorMatcher->evaluateRiskLevel('Low', 'High')->score);
        $this->assertSame(1.0, $this->investorMatcher->evaluateRiskLevel('Moderate', 'High')->score);

        // One level above tolerance -> 0.50
        $this->assertSame(0.50, $this->investorMatcher->evaluateRiskLevel('Moderate', 'Low')->score);
        $this->assertSame(0.50, $this->investorMatcher->evaluateRiskLevel('High', 'Moderate')->score);

        // Two levels above tolerance -> 0.0
        $this->assertSame(0.0, $this->investorMatcher->evaluateRiskLevel('High', 'Low')->score);

        // Missing / unconstrained -> 0.50
        $this->assertSame(0.50, $this->investorMatcher->evaluateRiskLevel(null, 'Moderate')->score);
        $this->assertSame(0.50, $this->investorMatcher->evaluateRiskLevel('Moderate', null)->score);
    }

    public function test_investor_location_scoring_branches(): void
    {
        // Exact match -> 1.0
        $f1 = $this->investorMatcher->evaluateLocation('Dhaka', 'Dhaka');
        $this->assertSame(1.0, $f1->score);

        // Investor open / unconstrained -> 0.75
        $f2 = $this->investorMatcher->evaluateLocation('Dhaka', null);
        $this->assertSame(0.75, $f2->score);

        // Different locations -> 0.25
        $f3 = $this->investorMatcher->evaluateLocation('Sylhet', 'Dhaka');
        $this->assertSame(0.25, $f3->score);

        // Missing business location -> 0.50
        $f4 = $this->investorMatcher->evaluateLocation(null, 'Dhaka');
        $this->assertSame(0.50, $f4->score);
    }

    public function test_investor_expected_involvement_scoring_branches(): void
    {
        // Exact match -> 1.0
        $f1 = $this->investorMatcher->evaluateInvolvement('Advisory', 'Advisory');
        $this->assertSame(1.0, $f1->score);

        // Investor flexible / unconstrained -> 0.75
        $f2 = $this->investorMatcher->evaluateInvolvement('Advisory', null);
        $this->assertSame(0.75, $f2->score);

        $f3 = $this->investorMatcher->evaluateInvolvement('Advisory', 'Flexible');
        $this->assertSame(0.75, $f3->score);

        // Mismatch -> 0.0
        $f4 = $this->investorMatcher->evaluateInvolvement('Hands-on', 'Passive');
        $this->assertSame(0.0, $f4->score);

        // Missing business involvement -> 0.50
        $f5 = $this->investorMatcher->evaluateInvolvement(null, 'Passive');
        $this->assertSame(0.50, $f5->score);
    }

    // ==========================================
    // 3. PROFESSIONAL FACTOR BRANCH TESTS
    // ==========================================

    public function test_professional_required_skill_overlap_branches(): void
    {
        // Full overlap (1.0) with whitespace and case variations
        $f1 = $this->professionalMatcher->evaluateSkillOverlap(
            [' PHP ', 'Laravel', 'REACT'],
            ['react', 'php', 'laravel', 'vue']
        );
        $this->assertSame(1.0, $f1->score);
        $this->assertStringContainsString('All 3 required skills matched', $f1->explanation);

        // Partial overlap: 2 of 3 matched = 0.6667
        $f2 = $this->professionalMatcher->evaluateSkillOverlap(
            ['PHP', 'Laravel', 'Rust'],
            ['php', 'laravel', 'python']
        );
        $this->assertSame(0.6667, $f2->score);
        $this->assertStringContainsString('2 of 3 required skills matched', $f2->explanation);
        $this->assertStringContainsString('Missing: rust', $f2->explanation);

        // No overlap -> 0.0
        $f3 = $this->professionalMatcher->evaluateSkillOverlap(
            ['Solidity', 'Rust'],
            ['PHP', 'JavaScript']
        );
        $this->assertSame(0.0, $f3->score);

        // No required skills, professional has skills -> 0.75
        $f4 = $this->professionalMatcher->evaluateSkillOverlap([], ['PHP', 'React']);
        $this->assertSame(0.75, $f4->score);

        // Neither has skills -> 0.50
        $f5 = $this->professionalMatcher->evaluateSkillOverlap([], []);
        $this->assertSame(0.50, $f5->score);
    }

    public function test_professional_industry_experience_branches(): void
    {
        // Direct match -> 1.0
        $f1 = $this->professionalMatcher->evaluateIndustryExperience('Technology', ['Technology', 'Education']);
        $this->assertSame(1.0, $f1->score);

        // Other industry experience present -> 0.25
        $f2 = $this->professionalMatcher->evaluateIndustryExperience('Technology', ['Healthcare', 'Agriculture']);
        $this->assertSame(0.25, $f2->score);
        $this->assertStringContainsString('experience in other industries', $f2->explanation);

        // No recorded industry experience -> 0.50
        $f3 = $this->professionalMatcher->evaluateIndustryExperience('Technology', []);
        $this->assertSame(0.50, $f3->score);

        // Missing business industry -> 0.50
        $f4 = $this->professionalMatcher->evaluateIndustryExperience(null, ['Technology']);
        $this->assertSame(0.50, $f4->score);
    }

    public function test_professional_experience_level_hierarchy(): void
    {
        // Professional meets or exceeds required level -> 1.0
        $this->assertSame(1.0, $this->professionalMatcher->evaluateExperienceLevel('Junior', 'Junior')->score);
        $this->assertSame(1.0, $this->professionalMatcher->evaluateExperienceLevel('Junior', 'Senior')->score);
        $this->assertSame(1.0, $this->professionalMatcher->evaluateExperienceLevel('Mid-level', 'Senior')->score);
        $this->assertSame(1.0, $this->professionalMatcher->evaluateExperienceLevel('Senior', 'Senior')->score);
        $this->assertSame(1.0, $this->professionalMatcher->evaluateExperienceLevel('Senior', 'Lead')->score);

        // One level below -> 0.50
        $this->assertSame(0.50, $this->professionalMatcher->evaluateExperienceLevel('Mid-level', 'Junior')->score);
        $this->assertSame(0.50, $this->professionalMatcher->evaluateExperienceLevel('Senior', 'Mid-level')->score);
        $this->assertSame(0.50, $this->professionalMatcher->evaluateExperienceLevel('Lead', 'Senior')->score);

        // Two or more levels below -> 0.0
        $this->assertSame(0.0, $this->professionalMatcher->evaluateExperienceLevel('Senior', 'Junior')->score);
        $this->assertSame(0.0, $this->professionalMatcher->evaluateExperienceLevel('Lead', 'Junior')->score);
        $this->assertSame(0.0, $this->professionalMatcher->evaluateExperienceLevel('Lead', 'Mid-level')->score);

        // Unconstrained / missing -> 0.75
        $this->assertSame(0.75, $this->professionalMatcher->evaluateExperienceLevel(null, 'Senior')->score);
        $this->assertSame(0.75, $this->professionalMatcher->evaluateExperienceLevel('Senior', null)->score);
    }

    public function test_professional_availability_branches(): void
    {
        // Exact match -> 1.0
        $f1 = $this->professionalMatcher->evaluateAvailability('Full time', 'Full time');
        $this->assertSame(1.0, $f1->score);

        // Full-time satisfies Part-time or Contract -> 1.0
        $f2 = $this->professionalMatcher->evaluateAvailability('Part time', 'Full time');
        $this->assertSame(1.0, $f2->score);

        $f3 = $this->professionalMatcher->evaluateAvailability('Contract', 'Full time');
        $this->assertSame(1.0, $f3->score);

        // Flexible / Any -> 0.85
        $f4 = $this->professionalMatcher->evaluateAvailability('Full time', 'Flexible');
        $this->assertSame(0.85, $f4->score);

        // Insufficient availability (Part-time for Full-time) -> 0.0
        $f5 = $this->professionalMatcher->evaluateAvailability('Full time', 'Part time');
        $this->assertSame(0.0, $f5->score);

        // Unconstrained / missing -> 0.75
        $f6 = $this->professionalMatcher->evaluateAvailability(null, 'Full time');
        $this->assertSame(0.75, $f6->score);
    }

    public function test_professional_location_branches(): void
    {
        // Exact match -> 1.0
        $f1 = $this->professionalMatcher->evaluateLocation('Dhaka', 'Dhaka');
        $this->assertSame(1.0, $f1->score);

        // Remote / open -> 0.75
        $f2 = $this->professionalMatcher->evaluateLocation('Dhaka', 'Remote');
        $this->assertSame(0.75, $f2->score);

        $f3 = $this->professionalMatcher->evaluateLocation('Dhaka', null);
        $this->assertSame(0.75, $f3->score);

        // Different location -> 0.25
        $f4 = $this->professionalMatcher->evaluateLocation('Dhaka', 'Chittagong');
        $this->assertSame(0.25, $f4->score);

        // Missing business location -> 0.50
        $f5 = $this->professionalMatcher->evaluateLocation(null, 'Dhaka');
        $this->assertSame(0.50, $f5->score);
    }

    public function test_professional_compensation_branches(): void
    {
        // Explicit overlap -> 1.0
        $f1 = $this->professionalMatcher->evaluateCompensation(['equity', 'salary'], ['salary']);
        $this->assertSame(1.0, $f1->score);

        // No overlap -> 0.0
        $f2 = $this->professionalMatcher->evaluateCompensation(['equity'], ['salary']);
        $this->assertSame(0.0, $f2->score);

        // Professional preference open -> 0.75
        $f3 = $this->professionalMatcher->evaluateCompensation(['equity'], []);
        $this->assertSame(0.75, $f3->score);

        // Business compensation structure unspecified -> 0.50
        $f4 = $this->professionalMatcher->evaluateCompensation([], ['salary']);
        $this->assertSame(0.50, $f4->score);
    }

    // ==========================================
    // 4. END-TO-END MATCHING PIPELINES
    // ==========================================

    public function test_full_investor_perfect_match(): void
    {
        $business = [
            'industry' => 'FinTech',
            'stage' => 'Early stage',
            'location' => 'Dhaka',
            'investment_amount' => '500000.00',
        ];

        $requirement = [
            'risk_level' => 'Moderate',
            'involvement_level' => 'Advisory',
            'investment_amount' => '500000.00',
            'location_preference' => 'Dhaka',
        ];

        $investor = [
            'industry' => 'FinTech',
            'business_stage' => 'Early stage',
            'location' => 'Dhaka',
            'risk_level' => 'Moderate',
            'involvement' => 'Advisory',
            'minimum_investment' => '100000.00',
            'maximum_investment' => '1000000.00',
        ];

        $result = $this->investorMatcher->match($business, $investor, $requirement);

        $this->assertSame(100, $result->overallScore);
        $this->assertSame('Strong Match', $result->matchGrade);
        $this->assertCount(6, $result->factors);
        $this->assertCount(6, $result->strongestAlignments);
        $this->assertEmpty($result->potentialGaps);
        $this->assertStringContainsString('Strong alignment across', $result->summaryExplanation);
    }

    public function test_full_professional_perfect_match(): void
    {
        $business = [
            'industry' => 'Technology',
            'location' => 'Dhaka',
        ];

        $requirement = [
            'minimum_experience_level' => 'Senior',
            'commitment_type' => 'Full time',
            'location_preference' => 'Dhaka',
            'equity_offered' => '5.00',
            'skills' => ['PHP', 'Laravel', 'React'],
        ];

        $professional = [
            'industry_experience' => ['Technology', 'E-commerce'],
            'experience_level' => 'Senior',
            'availability' => 'Full time',
            'location' => 'Dhaka',
            'compensation_preferences' => ['equity', 'salary'],
            'skills' => ['php', 'react', 'laravel', 'sql'],
        ];

        $result = $this->professionalMatcher->match($business, $professional, $requirement);

        $this->assertSame(100, $result->overallScore);
        $this->assertSame('Strong Match', $result->matchGrade);
        $this->assertCount(6, $result->factors);
        $this->assertCount(6, $result->strongestAlignments);
        $this->assertEmpty($result->potentialGaps);
    }

    public function test_match_result_serialization_and_disclaimer(): void
    {
        $factors = [
            new MatchFactorResult('industry', 'Industry Match', 0.50, 1.0, 'Aligned.'),
            new MatchFactorResult('location', 'Location Preference', 0.50, 0.20, 'Different.'),
        ];

        $result = MatchResult::fromFactors($factors);

        $this->assertSame(60, $result->overallScore);
        $this->assertSame('Moderate Match', $result->matchGrade);
        $this->assertCount(1, $result->strongestAlignments);
        $this->assertCount(1, $result->potentialGaps);

        $array = $result->toArray();
        $this->assertArrayHasKey('overall_score', $array);
        $this->assertArrayHasKey('match_grade', $array);
        $this->assertArrayHasKey('summary_explanation', $array);
        $this->assertArrayHasKey('factors', $array);
        $this->assertArrayHasKey('strongest_alignments', $array);
        $this->assertArrayHasKey('potential_gaps', $array);
        $this->assertArrayHasKey('disclaimer', $array);
        $this->assertSame('Match scores are recommendations, not guarantees. Review the underlying information before making decisions.', $array['disclaimer']);
    }
}

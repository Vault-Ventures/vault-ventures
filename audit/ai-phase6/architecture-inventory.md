# Current AI architecture file inventory

Generated from current file paths. Shared support files may appear in more than one feature.

## Foundation

- backend/config/ai.php
- backend/app/Services/BusinessAnalysis/GeminiAnalysisProvider.php
- backend/app/Services/BusinessAnalysis/DisabledAnalysisProvider.php
- backend/app/Services/BusinessAnalysis/AnalysisResult.php
- backend/app/Services/BusinessAnalysis/AnalysisProvider.php
- backend/app/Services/BusinessAnalysis/AnalysisPromptBuilder.php
- backend/app/Services/BusinessAnalysis/AnalysisInput.php
- backend/app/Services/BusinessAnalysis/AnalysisFailure.php
- backend/app/Providers/AppServiceProvider.php
- backend/tests/Fixtures/FakeAnalysisProvider.php
- backend/tests/Feature/AiFoundationTest.php

## Business

- src/tests/business-analysis.test.tsx
- backend/config/business_analysis.php
- backend/app/Services/BusinessAnalysis/GeminiAnalysisProvider.php
- backend/app/Services/BusinessAnalysis/DisabledAnalysisProvider.php
- backend/app/Services/BusinessAnalysis/BusinessAnalysisService.php
- backend/app/Services/BusinessAnalysis/AnalysisResult.php
- backend/app/Services/BusinessAnalysis/AnalysisRenderer.php
- backend/app/Services/BusinessAnalysis/AnalysisProvider.php
- backend/app/Services/BusinessAnalysis/AnalysisPromptBuilder.php
- backend/app/Services/BusinessAnalysis/AnalysisOutputValidator.php
- backend/app/Services/BusinessAnalysis/AnalysisInputBuilder.php
- backend/app/Services/BusinessAnalysis/AnalysisInput.php
- backend/app/Services/BusinessAnalysis/AnalysisFailure.php
- backend/app/Services/BusinessAnalysis/AnalysisContract.php
- backend/database/migrations/2026_09_10_000013_create_business_analyses_table.php
- backend/app/Policies/BusinessAnalysisPolicy.php
- backend/app/Models/BusinessAnalysis.php
- backend/app/Http/Resources/BusinessAnalysisResource.php
- backend/app/Http/Controllers/BusinessAnalysisController.php
- backend/app/Http/Requests/BusinessAnalysis/CreateBusinessAnalysisRequest.php
- backend/tests/Feature/BusinessNarrativeAnalysisTest.php
- backend/tests/Feature/BusinessAnalysisTest.php
- src/components/business/BusinessAnalysisPanel.tsx

## Readiness

- src/tests/readiness-insights.test.tsx
- backend/app/Services/Readiness/ReadinessInsightService.php
- backend/database/migrations/2026_09_10_000014_create_readiness_insights_table.php
- backend/app/Policies/ReadinessInsightPolicy.php
- backend/app/Models/ReadinessInsight.php
- backend/app/Http/Resources/ReadinessInsightResource.php
- backend/app/Http/Requests/Readiness/CreateReadinessInsightRequest.php
- backend/app/Http/Controllers/ReadinessInsightController.php
- backend/tests/Feature/ReadinessInsightTest.php
- src/components/business/ReadinessInsightsPanel.tsx

## Matching

- src/tests/matching-insights.test.tsx
- backend/app/Services/Matching/MatchingInsightService.php
- backend/app/Services/Matching/MatchingInsightResult.php
- backend/database/migrations/2026_09_22_000001_create_matching_insights_table.php
- backend/app/Models/MatchingInsight.php
- backend/app/Http/Resources/MatchingInsightResource.php
- backend/app/Http/Controllers/MatchingInsightController.php
- src/components/matching/MatchingInsightsSection.tsx
- backend/tests/Feature/MatchingInsightGenerationTest.php
- backend/tests/Feature/MatchingInsightFoundationTest.php
- backend/tests/Feature/MatchingInsightEvaluationTest.php

## Deal

- src/tests/deal-insights.test.tsx
- backend/app/Services/Deal/DealInsightService.php
- backend/app/Services/Deal/DealInsightResult.php
- backend/app/Services/Deal/DealInsightPromptBuilder.php
- backend/database/migrations/2026_09_23_000001_create_deal_insights_table.php
- backend/app/Models/DealInsight.php
- backend/app/Http/Resources/DealInsightResource.php
- backend/app/Http/Controllers/DealInsightController.php
- backend/tests/Feature/DealInsightGenerationTest.php
- backend/tests/Feature/DealInsightFoundationTest.php
- src/components/deals/DealInsightsSection.tsx

## Admin

- src/tests/admin-insights.test.tsx
- backend/app/Services/Admin/AdminInsightService.php
- backend/app/Services/Admin/AdminInsightResult.php
- backend/app/Services/Admin/AdminInsightPromptBuilder.php
- backend/database/migrations/2026_09_24_000001_create_admin_insights_table.php
- backend/app/Models/AdminInsight.php
- backend/app/Http/Resources/AdminInsightResource.php
- backend/app/Http/Controllers/AdminInsightController.php
- backend/tests/Feature/AdminInsightTest.php
- src/components/admin/AdminInsightsSection.tsx

Shared route declarations: backend/routes/api.php. Shared frontend methods/types: src/services/api.ts. Page integrations: src/pages/founder/BusinessProfile.tsx, ReadinessScore.tsx, DiscoverInvestors.tsx, DiscoverProfessionals.tsx; src/pages/shared/DiscoverBusinesses.tsx and DealRoom.tsx; src/pages/admin/Dashboard.tsx.

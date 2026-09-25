<?php

namespace App\Services\BusinessAnalysis;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

final class GeminiAnalysisProvider implements AnalysisProvider
{
    private const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';

    public function __construct(private AnalysisPromptBuilder $prompts) {}

    public function identifier(): string
    {
        return 'gemini';
    }

    public function matching(array $snapshot): string
    {
        return $this->request($this->prompts->matching($snapshot));
    }

    public function deal(array $snapshot): string
    {
        return $this->request(app(\App\Services\Deal\DealInsightPromptBuilder::class)->deal($snapshot));
    }

    public function admin(array $snapshot): string
    {
        return $this->request(app(\App\Services\Admin\AdminInsightPromptBuilder::class)->admin($snapshot));
    }

    public function modelIdentifier(): ?string
    {
        $model = config('ai.model');

        return is_string($model) && preg_match('/^gemini-[a-z0-9.-]{1,100}$/D', $model) ? $model : null;
    }

    /** Configuration readiness only; it does not claim that the remote service is healthy. */
    public function enabled(): bool
    {
        return is_string(config('ai.api_key')) && trim(config('ai.api_key')) !== '' && $this->modelIdentifier() !== null;
    }

    public function generate(array $snapshot): string
    {
        $raw = $this->request($this->prompts->references($snapshot));
        app(AnalysisOutputValidator::class)->validate($raw, $snapshot);

        return $raw;
    }

    public function analyze(AnalysisInput $input): AnalysisResult
    {
        return AnalysisResult::fromJson($this->request($this->prompts->narrative($input)));
    }

    public function readiness(array $snapshot): AnalysisResult
    {
        return AnalysisResult::fromJson($this->request($this->prompts->readiness($snapshot)));
    }

    private function request(array $prompt): string
    {
        if (! $this->enabled()) {
            throw new AnalysisFailure('ANALYSIS_NOT_CONFIGURED', 503);
        }
        try {
            $response = Http::acceptJson()->asJson()
                ->withHeaders(['x-goog-api-key' => config('ai.api_key')])
                ->connectTimeout(5)->timeout(max(1, min(45, (int) config('ai.timeout', 20))))
                ->withOptions(['allow_redirects' => false])
                ->post(self::ENDPOINT, [
                    'model' => $this->modelIdentifier(), 'store' => false,
                    'system_instruction' => $prompt['system_instruction'], 'input' => $prompt['input'],
                    'response_format' => ['type' => 'text', 'mime_type' => 'application/json', 'schema' => $prompt['schema']],
                    'generation_config' => ['max_output_tokens' => 4096, 'thinking_level' => 'low'],
                ]);
        } catch (ConnectionException $failure) {
            // Inspect only locally; never retain an HTTP exception (it can contain request secrets).
            $timeout = str_contains($failure->getMessage(), 'cURL error 28');
            throw new AnalysisFailure($timeout ? 'ANALYSIS_TIMEOUT' : 'ANALYSIS_CONNECTION_FAILURE', 503);
        } catch (\Throwable) {
            throw new AnalysisFailure('ANALYSIS_ADAPTER_FAILURE', 503);
        }
        if (! $response->successful()) {
            throw new AnalysisFailure($response->status() === 429 ? 'ANALYSIS_PROVIDER_RATE_LIMIT' : 'ANALYSIS_PROVIDER_HTTP_FAILURE', 503);
        }
        try {
            if (strlen($response->body()) > 131072) {
                throw new \UnexpectedValueException;
            }
            $body = json_decode($response->body(), true, 32, JSON_THROW_ON_ERROR);
            if (! is_array($body) || ($body['status'] ?? null) !== 'completed' || ! is_array($body['steps'] ?? null)) {
                throw new \UnexpectedValueException;
            }
            $text = '';
            foreach ($body['steps'] as $step) {
                if (($step['type'] ?? null) !== 'model_output') {
                    continue;
                }
                if (isset($step['status']) && $step['status'] !== 'done') {
                    throw new \UnexpectedValueException;
                }
                if (! is_array($step['content'] ?? null)) {
                    throw new \UnexpectedValueException;
                }
                foreach ($step['content'] as $part) {
                    if (($part['type'] ?? null) !== 'text' || ! is_string($part['text'] ?? null)) {
                        throw new \UnexpectedValueException;
                    }
                    $text .= $part['text'];
                }
            }
            if (trim($text) === '') {
                throw new \UnexpectedValueException;
            }

            return $text;
        } catch (\Throwable) {
            throw new AnalysisFailure('INVALID_ANALYSIS_OUTPUT', 502);
        }
    }
}

import { Injectable, Logger } from '@nestjs/common';

export interface MarketEvaluation {
  marketId: number;
  resolvability: number; // 0-10
  clarity: number; // 0-10
  manipulabilityRisk: number; // 0-10
  explanation: string; // 1-3 sentences
  evaluatedAt: Date;
}

interface MarketForEvaluation {
  marketId: number;
  title: string;
  resolutionCriteria: string;
  outcomes: string[];
}

@Injectable()
export class AIEvaluationService {
  private readonly logger = new Logger(AIEvaluationService.name);

  /**
   * Evaluate a market using AI (OpenAI/Claude)
   */
  async evaluateMarket(market: MarketForEvaluation): Promise<MarketEvaluation | null> {
    this.logger.log(`🤖 Evaluating market ${market.marketId}: "${market.title}"`);

    try {
      // Try AI evaluation first
      const aiEvaluation = await this.callAI(market);
      
      if (aiEvaluation) {
        this.logger.log(`✅ AI evaluation completed for market ${market.marketId}`);
        return aiEvaluation;
      }

      // Fallback to mock evaluation
      this.logger.warn(`⚠️ AI evaluation failed for market ${market.marketId}, using fallback`);
      return this.mockEvaluation(market);

    } catch (error) {
      this.logger.error(`❌ Failed to evaluate market ${market.marketId}:`, error);
      return this.mockEvaluation(market);
    }
  }

  /**
   * Call AI service (OpenAI/Claude) for market evaluation
   */
  private async callAI(market: MarketForEvaluation): Promise<MarketEvaluation | null> {
    // Check if we have API keys configured
    const openaiKey = process.env.OPENAI_API_KEY;
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !claudeKey) {
      this.logger.warn('No AI API keys configured, using mock evaluation');
      return null;
    }

    const prompt = this.buildEvaluationPrompt(market);

    try {
      // Try OpenAI first
      if (openaiKey) {
        return await this.callOpenAI(prompt, market);
      }
      
      // Try Claude if OpenAI not available
      if (claudeKey) {
        return await this.callClaude(prompt, market);
      }

    } catch (error) {
      this.logger.error('AI API call failed:', error);
      return null;
    }

    return null;
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string, market: MarketForEvaluation): Promise<MarketEvaluation | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Use cheaper model for evaluations
          messages: [
            {
              role: 'system',
              content: 'You are an expert at evaluating prediction markets. Always respond with valid JSON only, no additional text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent scoring
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      return this.parseAIResponse(content, market);

    } catch (error) {
      this.logger.error('OpenAI API call failed:', error);
      return null;
    }
  }

  /**
   * Call Claude API
   */
  private async callClaude(prompt: string, market: MarketForEvaluation): Promise<MarketEvaluation | null> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307', // Use cheaper model
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.content[0]?.text;
      
      if (!content) {
        throw new Error('No content in Claude response');
      }

      return this.parseAIResponse(content, market);

    } catch (error) {
      this.logger.error('Claude API call failed:', error);
      return null;
    }
  }

  /**
   * Build the evaluation prompt
   */
  private buildEvaluationPrompt(market: MarketForEvaluation): string {
    return `
Evaluate this prediction market on three metrics (0-10 scale):

**Market Details:**
Title: "${market.title}"
Resolution Criteria: "${market.resolutionCriteria}"

**Evaluation Metrics:**
1. **Resolvability (0-10)**: Can this market be resolved using clear, public, objective data?
2. **Clarity (0-10)**: Is the phrasing unambiguous and specific?
3. **Manipulability Risk (0-10)**: Is the outcome at risk of being influenced by insiders or vague sources?

**Instructions:**
- Score each metric from 0 (worst) to 10 (best)
- Higher manipulability risk = lower score (0 = high risk, 10 = low risk)
- Provide a 1-3 sentence explanation of your overall assessment

**Response Format (JSON only):**
{
  "resolvability": 8,
  "clarity": 7,
  "manipulabilityRisk": 6,
  "explanation": "Brief explanation of the scores in 1-3 sentences."
}`;
  }

  /**
   * Parse AI response into evaluation
   */
  private parseAIResponse(content: string, market: MarketForEvaluation): MarketEvaluation | null {
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        marketId: market.marketId,
        resolvability: this.validateScore(parsed.resolvability),
        clarity: this.validateScore(parsed.clarity),
        manipulabilityRisk: this.validateScore(parsed.manipulabilityRisk),
        explanation: parsed.explanation || 'No explanation provided',
        evaluatedAt: new Date(),
      };

    } catch (error) {
      this.logger.error('Failed to parse AI response:', error);
      return null;
    }
  }

  /**
   * Validate score is between 0-10
   */
  private validateScore(score: any): number {
    const num = Number(score);
    if (isNaN(num)) return 5; // Default to middle score
    return Math.max(0, Math.min(10, Math.round(num)));
  }

  /**
   * Generate mock evaluation when AI is not available
   */
  private mockEvaluation(market: MarketForEvaluation): MarketEvaluation {
    this.logger.log(`🎭 Generating mock evaluation for market ${market.marketId}`);

    // Simple heuristic-based scoring
    let resolvability = 5;
    let clarity = 5;
    let manipulabilityRisk = 5;

    const title = market.title.toLowerCase();
    const criteria = market.resolutionCriteria.toLowerCase();

    // Resolvability heuristics
    if (criteria.includes('public') || criteria.includes('official') || criteria.includes('announced')) {
      resolvability += 2;
    }
    if (criteria.includes('verified') || criteria.includes('confirm')) {
      resolvability += 1;
    }
    if (criteria.length > 100) { // Detailed criteria
      resolvability += 1;
    }

    // Clarity heuristics
    if (market.outcomes.length === 2) { // Binary markets often clearer
      clarity += 1;
    }
    if (criteria.includes('by') && criteria.includes('2025')) { // Has deadline
      clarity += 1;
    }
    if (title.includes('will') || title.includes('?')) {
      clarity += 1;
    }

    // Manipulability risk heuristics (lower score = higher risk)
    if (title.includes('celebrity') || title.includes('social') || title.includes('twitter') || title.includes('x.com')) {
      manipulabilityRisk -= 1; // Social media can be manipulated
    }
    if (criteria.includes('official') || criteria.includes('government')) {
      manipulabilityRisk += 2; // Official sources harder to manipulate
    }

    // Clamp scores to 0-10
    resolvability = Math.max(0, Math.min(10, resolvability));
    clarity = Math.max(0, Math.min(10, clarity));
    manipulabilityRisk = Math.max(0, Math.min(10, manipulabilityRisk));

    const explanation = `Mock evaluation: Market appears ${resolvability >= 7 ? 'highly' : resolvability >= 4 ? 'moderately' : 'poorly'} resolvable with ${clarity >= 7 ? 'clear' : 'somewhat ambiguous'} criteria. ${manipulabilityRisk >= 7 ? 'Low' : manipulabilityRisk >= 4 ? 'Moderate' : 'High'} manipulation risk detected.`;

    return {
      marketId: market.marketId,
      resolvability,
      clarity,
      manipulabilityRisk,
      explanation,
      evaluatedAt: new Date(),
    };
  }
}
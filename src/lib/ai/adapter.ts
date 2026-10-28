export type AiSuggestion = {
  workDescription?: string;
  documentDate?: string;
  projectReference?: string;
  quantities?: { value: number; unit?: string; confidence: number }[];
  visibleText?: string;
  category?: string;
  confidence: number;
  reviewRequired: true;
  sourceFile: string;
  sourceExcerpt?: string;
};

export type AiExtractionInput = {
  organizationId: string;
  fileId: string;
  fileName: string;
  mimeType: string;
  textContent?: string;
};

export interface AiProviderAdapter {
  name: string;
  enabled: boolean;
  extract(input: AiExtractionInput): Promise<AiSuggestion>;
}

// Manual-only fallback (default). Never sends data externally.
export class ManualOnlyAdapter implements AiProviderAdapter {
  name = "manual-only";
  enabled = false;
  async extract(): Promise<AiSuggestion> {
    throw new Error("AI_DISABLED");
  }
}

// Deterministic fixture adapter for tests/dev
export class FixtureAdapter implements AiProviderAdapter {
  name = "fixture";
  enabled = true;
  constructor(private fixture: AiSuggestion) {}
  async extract(input: AiExtractionInput): Promise<AiSuggestion> {
    return { ...this.fixture, sourceFile: input.fileName, reviewRequired: true };
  }
}

// Schema validation for AI output (server-side). Rejects malformed.
import { z } from "zod";
export const aiSuggestionSchema = z.object({
  workDescription: z.string().max(2000).optional(),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  projectReference: z.string().max(120).optional(),
  quantities: z.array(z.object({ value: z.number().nonnegative(), unit: z.string().max(40).optional(), confidence: z.number().min(0).max(1) })).optional(),
  visibleText: z.string().max(5000).optional(),
  category: z.string().max(80).optional(),
  confidence: z.number().min(0).max(1),
  reviewRequired: z.literal(true),
  sourceFile: z.string().min(1),
  sourceExcerpt: z.string().max(500).optional(),
});

export function validateAiSuggestion(raw: unknown): AiSuggestion {
  const parsed = aiSuggestionSchema.parse(raw);
  return parsed as AiSuggestion;
}

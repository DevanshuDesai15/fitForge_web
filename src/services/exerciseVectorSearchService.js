import { HfInference } from "@huggingface/inference";

import geminiConfig from "../config/geminiConfig";
import {
  buildExerciseSearchQuery,
  DEFAULT_EMBEDDING_MODEL,
  toVectorLiteral,
} from "../../scripts/lib/exerciseMigration.js";

class ExerciseVectorSearchService {
  constructor(config = geminiConfig) {
    this.config = config;
    this.supabase = null;
    this.client = null;
    this.embeddingModel =
      (typeof import.meta !== "undefined" &&
        import.meta.env?.VITE_HUGGINGFACE_EMBEDDING_MODEL) ||
      DEFAULT_EMBEDDING_MODEL;
  }

  setSupabase(supabase) {
    this.supabase = supabase;
  }

  _getClient() {
    if (this.client) {
      return this.client;
    }

    if (!this.config.apiKey) {
      throw new Error("Hugging Face API key is missing");
    }

    this.client = new HfInference(this.config.apiKey);
    return this.client;
  }

  async _generateQueryEmbedding(query) {
    const response = await this._getClient().featureExtraction({
      model: this.embeddingModel,
      inputs: `query: ${query}`,
    });

    return Array.isArray(response[0]) ? response[0] : response;
  }

  async searchRelevantExercises(context, options = {}) {
    if (!this.supabase) {
      return [];
    }

    const query = buildExerciseSearchQuery(context);
    if (!query) {
      return [];
    }

    const embedding = await this._generateQueryEmbedding(query);
    const { data, error } = await this.supabase.rpc("match_exercises", {
      query_embedding: toVectorLiteral(embedding),
      match_count: options.limit || 5,
      filter_body_part: options.bodyPart || null,
    });

    if (error) {
      console.error("Exercise vector search failed:", error);
      return [];
    }

    return data || [];
  }
}

const exerciseVectorSearchService = new ExerciseVectorSearchService();

export default exerciseVectorSearchService;
export { ExerciseVectorSearchService };

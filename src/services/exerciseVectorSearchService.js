import {
  buildExerciseSearchQuery,
  toVectorLiteral,
} from "../../scripts/lib/exerciseMigration.js";
import aiApiClient from "./aiApiClient";

class ExerciseVectorSearchService {
  constructor() {
    this.supabase = null;
  }

  setSupabase(supabase) {
    this.supabase = supabase;
  }

  async _generateQueryEmbedding(query) {
    return aiApiClient.embedding(`query: ${query}`);
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

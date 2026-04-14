import { beforeEach, describe, expect, it, vi } from "vitest";

const mockChatCompletion = vi.fn();
const mockSearchRelevantExercises = vi.fn();
const mockFetchExerciseForRAG = vi.fn();

vi.mock("@huggingface/inference", () => ({
  HfInference: vi.fn().mockImplementation(function MockHfInference() {
    return {
      chatCompletion: mockChatCompletion,
    };
  }),
}));

vi.mock("../exerciseVectorSearchService", () => ({
  default: {
    setSupabase: vi.fn(),
    searchRelevantExercises: mockSearchRelevantExercises,
  },
}));

vi.mock("../localExerciseService", () => ({
  fetchExerciseForRAG: mockFetchExerciseForRAG,
}));

describe("HuggingFaceService safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.spyOn(globalThis, "setInterval").mockReturnValue(1);
    mockSearchRelevantExercises.mockResolvedValue([]);
    mockFetchExerciseForRAG.mockResolvedValue(null);
  });

  it("retries retryable provider failures before succeeding", async () => {
    const { HuggingFaceService } = await import("../huggingFaceService");
    const service = new HuggingFaceService({
      apiKey: "hf_test",
      model: "test-model",
      temperature: 0.4,
      maxTokens: 256,
      requestTimeout: 1000,
      maxRetries: 1,
      emergencyDisable: false,
      useGeminiAI: true,
    });
    service._sleep = vi.fn().mockResolvedValue(undefined);

    mockChatCompletion
      .mockRejectedValueOnce(Object.assign(new Error("rate limit"), { status: 429 }))
      .mockResolvedValueOnce({
        choices: [{ message: { content: "{\"ok\":true}" } }],
      });

    await expect(service.generateWorkoutAnalysis(
      { name: "Bench Press" },
      [{ weight: 135, reps: 8 }]
    )).resolves.toEqual({ ok: true });
    expect(mockChatCompletion).toHaveBeenCalledTimes(2);
  });

  it("surfaces a timeout when the provider never responds", async () => {
    vi.useFakeTimers();
    const { HuggingFaceService } = await import("../huggingFaceService");
    const service = new HuggingFaceService({
      apiKey: "hf_test",
      model: "test-model",
      temperature: 0.4,
      maxTokens: 256,
      requestTimeout: 25,
      maxRetries: 0,
      emergencyDisable: false,
      useGeminiAI: true,
    });

    mockChatCompletion.mockImplementation(
      () => new Promise(() => {})
    );

    const requestPromise = service.generateWorkoutAnalysis(
      { name: "Bench Press" },
      [{ weight: 135, reps: 8 }]
    );

    const assertion = expect(requestPromise).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(25);
    await assertion;
  });
});

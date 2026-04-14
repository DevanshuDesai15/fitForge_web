import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import PropTypes from "prop-types";

import { useAISuggestions } from "./useAISuggestions";

const {
  mockSetSupabase,
  mockCalculateNextProgression,
} = vi.hoisted(() => ({
  mockSetSupabase: vi.fn(),
  mockCalculateNextProgression: vi.fn(),
}));

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    currentUser: { uid: "user_123" },
  }),
}));

vi.mock("../../../hooks/useSupabase", () => ({
  useSupabase: () => ({ from: vi.fn() }),
}));

vi.mock("../../../services/progressiveOverloadAI", () => ({
  default: {
    setSupabase: mockSetSupabase,
    calculateNextProgression: mockCalculateNextProgression,
  },
}));

describe("useAISuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    function Wrapper({ children }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    Wrapper.propTypes = {
      children: PropTypes.node.isRequired,
    };

    return Wrapper;
  };

  it("loads suggestions via calculateNextProgression and filters low-confidence results", async () => {
    mockCalculateNextProgression
      .mockResolvedValueOnce({
        exerciseName: "Bench Press",
        confidenceLevel: 0.82,
      })
      .mockResolvedValueOnce({
        exerciseName: "Lateral Raise",
        confidenceLevel: 0.2,
      });

    const { result } = renderHook(() => useAISuggestions(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.loadAISuggestions(["Bench Press", "Lateral Raise"]);
    });

    expect(mockSetSupabase).toHaveBeenCalled();
    expect(mockCalculateNextProgression).toHaveBeenCalledWith(
      "user_123",
      "Bench Press"
    );
    expect(mockCalculateNextProgression).toHaveBeenCalledWith(
      "user_123",
      "Lateral Raise"
    );
    await waitFor(() => {
      expect(result.current.aiSuggestions).toEqual({
        "Bench Press": {
          exerciseName: "Bench Press",
          confidenceLevel: 0.82,
        },
      });
    });
  });
});

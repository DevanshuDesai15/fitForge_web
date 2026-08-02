import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../AuthContext";

const clerkMocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  signOut: vi.fn(),
  openSignIn: vi.fn(),
  openSignUp: vi.fn(),
}));

const aiClientMocks = vi.hoisted(() => ({
  cleanup: vi.fn(),
  registerAiTokenProvider: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({
    user: null,
    isLoaded: true,
  }),
  useAuth: () => ({
    isLoaded: true,
    getToken: clerkMocks.getToken,
  }),
  useClerk: () => ({
    signOut: clerkMocks.signOut,
    openSignIn: clerkMocks.openSignIn,
    openSignUp: clerkMocks.openSignUp,
  }),
}));

vi.mock("../../services/aiApiClient", () => ({
  registerAiTokenProvider: aiClientMocks.registerAiTokenProvider,
}));

vi.mock("../../services/analyticsService", () => ({
  identifyUser: vi.fn(),
  resetAnalytics: vi.fn(),
}));

describe("AuthProvider AI authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiClientMocks.registerAiTokenProvider.mockReturnValue(
      aiClientMocks.cleanup
    );
    clerkMocks.getToken.mockResolvedValue("session_token");
  });

  it("registers Clerk's default session-token provider and cleans it up", async () => {
    const view = render(
      <AuthProvider>
        <div>authenticated application</div>
      </AuthProvider>
    );

    expect(screen.getByText("authenticated application")).toBeInTheDocument();
    expect(aiClientMocks.registerAiTokenProvider).toHaveBeenCalledTimes(1);

    const provider =
      aiClientMocks.registerAiTokenProvider.mock.calls[0][0];
    await act(async () => {
      await expect(provider()).resolves.toBe("session_token");
    });
    expect(clerkMocks.getToken).toHaveBeenCalledWith();

    view.unmount();
    expect(aiClientMocks.cleanup).toHaveBeenCalledTimes(1);
  });
});

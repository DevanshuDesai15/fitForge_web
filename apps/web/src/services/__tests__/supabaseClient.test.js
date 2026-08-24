import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn(() => ({ from: vi.fn() })));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args) => createClientMock(...args),
}));

describe("shared Supabase client", () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
  });

  it("creates one client and reuses it", async () => {
    const { getSupabaseClient } = await import("../supabaseClient");

    const firstClient = getSupabaseClient();
    const secondClient = getSupabaseClient();

    expect(firstClient).toBe(secondClient);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });

  it("resolves access tokens from the current provider", async () => {
    const { getSupabaseClient, setSupabaseTokenProvider } = await import(
      "../supabaseClient"
    );
    getSupabaseClient();
    const accessToken = createClientMock.mock.calls[0][2].accessToken;
    const firstProvider = vi.fn().mockResolvedValue("first-token");
    const secondProvider = vi.fn().mockResolvedValue("second-token");

    const clearFirst = setSupabaseTokenProvider(firstProvider);
    await expect(accessToken()).resolves.toBe("first-token");

    const clearSecond = setSupabaseTokenProvider(secondProvider);
    clearFirst();
    await expect(accessToken()).resolves.toBe("second-token");

    clearSecond();
    await expect(accessToken()).resolves.toBeNull();
  });
});

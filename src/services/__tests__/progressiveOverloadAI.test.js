import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressiveOverloadAIService } from '../progressiveOverloadAI';
import aiDatabaseService from '../aiDatabaseService';

vi.mock('../aiDatabaseService', () => ({
  default: {
    getAISuggestions: vi.fn(),
    updateAISuggestions: vi.fn(),
    saveAISuggestions: vi.fn(),
  },
}));

vi.mock('../huggingFaceService', () => ({
  default: {},
}));

function createService() {
  const service = new ProgressiveOverloadAIService();
  service.setSupabase({ from: vi.fn() });
  return service;
}

describe('ProgressiveOverloadAIService plateau alert persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads active plateau alerts from aiDatabaseService', async () => {
    aiDatabaseService.getAISuggestions.mockResolvedValue({
      plateauAlerts: [
        {
          id: 'alert_active',
          status: 'active',
          dismissed: false,
          lastShown: null,
        },
        {
          id: 'alert_dismissed',
          status: 'active',
          dismissed: true,
          lastShown: null,
        },
      ],
    });

    const service = createService();
    const result = await service.getActivePlateauAlerts('user_123');

    expect(aiDatabaseService.getAISuggestions).toHaveBeenCalledWith(service.supabase, 'user_123');
    expect(result).toEqual([
      expect.objectContaining({
        id: 'alert_active',
      }),
    ]);
  });

  it('acknowledges a plateau alert through aiDatabaseService', async () => {
    aiDatabaseService.getAISuggestions.mockResolvedValue({
      plateauAlerts: [
        {
          id: 'alert_1',
          status: 'active',
          acknowledged: false,
          dismissed: false,
          lastShown: null,
        },
      ],
    });
    aiDatabaseService.updateAISuggestions.mockResolvedValue(undefined);

    const service = createService();
    const result = await service.acknowledgePlateauAlert('user_123', 'alert_1');

    expect(result).toBe(true);
    expect(aiDatabaseService.updateAISuggestions).toHaveBeenCalledWith(
      service.supabase,
      'user_123',
      expect.objectContaining({
        plateauAlerts: [
          expect.objectContaining({
            id: 'alert_1',
            acknowledged: true,
            status: 'acknowledged',
            lastShown: expect.any(Date),
          }),
        ],
      })
    );
  });

  it('dismisses a plateau alert through aiDatabaseService', async () => {
    aiDatabaseService.getAISuggestions.mockResolvedValue({
      plateauAlerts: [
        {
          id: 'alert_1',
          status: 'active',
          acknowledged: false,
          dismissed: false,
          lastShown: null,
        },
      ],
    });
    aiDatabaseService.updateAISuggestions.mockResolvedValue(undefined);

    const service = createService();
    const result = await service.dismissPlateauAlert('user_123', 'alert_1', 'resolved');

    expect(result).toBe(true);
    expect(aiDatabaseService.updateAISuggestions).toHaveBeenCalledWith(
      service.supabase,
      'user_123',
      expect.objectContaining({
        plateauAlerts: [
          expect.objectContaining({
            id: 'alert_1',
            dismissed: true,
            dismissalReason: 'resolved',
            status: 'dismissed',
            dismissedAt: expect.any(Date),
          }),
        ],
      })
    );
  });

  it('merges and persists plateau alerts through aiDatabaseService', async () => {
    aiDatabaseService.getAISuggestions.mockResolvedValue({
      nextWorkoutSuggestions: [{ exerciseId: 'bench' }],
      progressionPlan: { week: 1 },
      plateauAlerts: [
        {
          id: 'old_alert',
          exerciseId: 'squat',
          createdAt: '2026-04-01T00:00:00.000Z',
        },
      ],
    });
    aiDatabaseService.saveAISuggestions.mockResolvedValue(undefined);

    const service = createService();

    await service._savePlateauAlerts('user_123', [
      {
        id: 'new_alert',
        exerciseId: 'bench',
        createdAt: '2026-04-06T00:00:00.000Z',
      },
    ]);

    expect(aiDatabaseService.saveAISuggestions).toHaveBeenCalledWith(
      service.supabase,
      'user_123',
      expect.objectContaining({
        nextWorkoutSuggestions: [{ exerciseId: 'bench' }],
        progressionPlan: { week: 1 },
        plateauAlerts: expect.arrayContaining([
          expect.objectContaining({ id: 'old_alert', exerciseId: 'squat' }),
          expect.objectContaining({ id: 'new_alert', exerciseId: 'bench' }),
        ]),
      })
    );
  });
});

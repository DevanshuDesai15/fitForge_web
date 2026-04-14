import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PreferencesTab from '../PreferencesTab';
import EditProfileModal from '../EditProfileModal';

describe('Profile toggles', () => {
  it('uses the shared switch in PreferencesTab and forwards the checked value', () => {
    const onNotificationChange = vi.fn();

    render(
      <PreferencesTab
        preferences={{ units: 'imperial', theme: 'dark', language: 'english', autoSync: true }}
        notifications={{ workoutReminders: true, progressUpdates: true, achievements: true, aiRecommendations: true }}
        storageUsed={0}
        onPreferenceChange={vi.fn()}
        onNotificationChange={onNotificationChange}
        onExportData={vi.fn()}
        onClearCache={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Workout Reminders' }));

    expect(onNotificationChange).toHaveBeenCalledWith('workoutReminders', false);
  });

  it('uses the shared switch in EditProfileModal notifications', () => {
    render(
      <EditProfileModal
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        loading={false}
        preferences={{ units: 'imperial' }}
        userData={{
          fullName: 'Grant Ustin',
          email: 'grant@example.com',
        }}
      />
    );

    fireEvent.click(screen.getByText('Notifications'));
    const workoutRemindersToggle = screen.getByRole('checkbox', { name: 'Workout Reminders' });
    expect(workoutRemindersToggle).toBeChecked();

    fireEvent.click(workoutRemindersToggle);

    expect(screen.getByRole('checkbox', { name: 'Workout Reminders' })).not.toBeChecked();
  });
});

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Edit3, LogOut, Settings, Shield, User } from 'lucide-react';
import { Alert, Avatar, Box, Button, Select, Typography } from '@mui/material';
import { MobileHeroStat, MobileScreen, MobileSignOutDialog, MobileState, MobileTabs } from '../mobile';
import FitForgeSwitch from '../common/FitForgeSwitch';
import { convertWeight, formatHeight, formatWeight } from '../../utils/unitConversions';

const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
const cardSx = { p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'background.paper' };
const divider = <Box aria-hidden="true" sx={{ height: 1, backgroundColor: 'border.main' }} />;

const initials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase();
};

const formatMemberSince = (date) => {
  const d = date ? new Date(date) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;
};

function SwitchRow({ label, description, checked, onChange }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 500 }}>{label}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 0.25 }}>{description}</Typography>
      </Box>
      <FitForgeSwitch checked={checked} onChange={(e) => onChange(e.target.checked)} inputProps={{ 'aria-label': label }} />
    </Box>
  );
}

SwitchRow.propTypes = { label: PropTypes.string.isRequired, description: PropTypes.string.isRequired, checked: PropTypes.bool.isRequired, onChange: PropTypes.func.isRequired };

// Kit Select: label above, inset field, native control so phones open their own picker.
function SelectField({ label, value, options, onChange }) {
  return (
    <Box>
      <Typography component="label" htmlFor={`pref-${label}`} sx={{ display: 'block', color: 'text.secondary', fontSize: '0.75rem', mb: 1 }}>{label}</Typography>
      <Select
        native
        fullWidth
        id={`pref-${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'border.main' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main', borderWidth: '1px' },
          '& .MuiSelect-select': { py: 1.5, fontSize: '1rem' },
        }}
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
    </Box>
  );
}

SelectField.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired, options: PropTypes.array.isRequired, onChange: PropTypes.func.isRequired };

function ProfileSection({ userData, stats, statsLoading, preferences }) {
  const memberSince = formatMemberSince(userData.createdAt);
  const units = preferences?.units === 'metric' ? 'kg' : 'lbs';
  const details = [
    ['Height', userData.height ? formatHeight(userData.height, userData.heightUnit, preferences?.units || 'imperial') : null],
    ['Weight', userData.weight ? formatWeight(convertWeight(userData.weight, userData.weightUnit || 'kg', units), units) : null],
    ['Age', userData.age || null],
    ['Fitness goal', userData.fitnessGoal || null],
  ].filter(([, v]) => v);

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ ...cardSx, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', color: '#121212', fontSize: 24, fontWeight: 800 }}>
          {initials(userData.fullName || userData.username)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.2 }}>{userData.fullName || userData.username || 'User'}</Typography>
          {memberSince ? <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Member since {memberSince}</Typography> : null}
        </Box>
      </Box>

      {statsLoading ? (
        <MobileState kind="loading" title="Loading your stats" />
      ) : (
        <MobileHeroStat
          value={stats.totalWorkouts}
          caption={memberSince ? `Workouts logged since ${memberSince}` : 'Workouts logged'}
          stats={[
            { value: stats.currentStreak, label: 'day streak' },
            { value: stats.thisWeek, label: 'this week' },
            { value: stats.caloriesBurned.toLocaleString(), label: 'calories (est.)' },
          ]}
        />
      )}

      {userData.bio || details.length ? (
        <Box sx={{ ...cardSx, display: 'grid', gap: 1.75 }}>
          {userData.bio ? <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{userData.bio}</Typography> : null}
          {details.map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography sx={{ color: 'text.secondary' }}>{label}</Typography>
              <Typography sx={{ ...mono, fontSize: '0.95rem', textAlign: 'right' }}>{value}</Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

ProfileSection.propTypes = { userData: PropTypes.object.isRequired, stats: PropTypes.object.isRequired, statsLoading: PropTypes.bool, preferences: PropTypes.object };

const GOAL_OPTIONS = [3, 4, 5, 6];

// The kit's four settings in one quiet card: three switches split by hairlines, then the weekly goal.
function PreferencesSection({ preferences, actions }) {
  const pref = (key, value) => actions.onPreferenceChange(key, value);
  const goal = Number(preferences?.weeklyGoal) || 4;
  const goals = GOAL_OPTIONS.includes(goal) ? GOAL_OPTIONS : [...GOAL_OPTIONS, goal].sort((x, y) => x - y);
  const rows = [
    <SwitchRow key="units" label="Metric units" description="Show weights in kilograms" checked={preferences?.units === 'metric'} onChange={(on) => pref('units', on ? 'metric' : 'imperial')} />,
    <SwitchRow key="awake" label="Keep screen awake" description="During an active workout" checked={preferences?.keepScreenAwake !== false} onChange={(on) => pref('keepScreenAwake', on)} />,
    <SwitchRow key="rest" label="Rest timer alerts" description="Vibrate when a rest period ends" checked={preferences?.restTimerAlerts === true} onChange={(on) => pref('restTimerAlerts', on)} />,
    <SelectField key="goal" label="Weekly workout goal" value={String(goal)} options={goals.map((n) => [String(n), `${n} per week`])} onChange={(v) => pref('weeklyGoal', Number(v))} />,
  ];
  return (
    <Box sx={{ ...cardSx, display: 'grid', gap: 2.5 }}>
      {rows.flatMap((row, i) => (i ? [<Box key={`d${i}`} aria-hidden="true" sx={{ height: 1, backgroundColor: 'border.main' }} />, row] : [row]))}
    </Box>
  );
}

PreferencesSection.propTypes = { preferences: PropTypes.object, actions: PropTypes.object.isRequired };

function AccountSection({ userData, actions, hasUnfinishedSession }) {
  const { onSignOut } = actions;
  const [confirming, setConfirming] = useState(false);
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ ...cardSx, display: 'grid', gap: 1.75 }}>
        {[['Email', userData.email || '—'], ['Auth provider', 'Clerk']].map(([label, value]) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography sx={{ color: 'text.secondary' }}>{label}</Typography>
            <Typography sx={{ ...mono, fontSize: '0.95rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button fullWidth variant="text" onClick={actions.onExportData}>Export data</Button>
        <Button fullWidth variant="text" onClick={actions.onClearCache}>Clear cache</Button>
      </Box>
      <Button fullWidth variant="outlined" startIcon={<LogOut size={18} />} onClick={() => setConfirming(true)}>Sign out</Button>
      {divider}
      <Alert severity="warning">Deleting your account removes every logged workout. This cannot be undone.</Alert>
      <Button fullWidth color="error" variant="outlined" disabled>Delete account</Button>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', textAlign: 'center' }}>Account deletion isn&apos;t available in the app yet.</Typography>

      <MobileSignOutDialog
        open={confirming}
        hasUnfinishedSession={hasUnfinishedSession}
        onCancel={() => setConfirming(false)}
        onConfirm={() => { setConfirming(false); onSignOut(); }}
      />
    </Box>
  );
}

AccountSection.propTypes = { userData: PropTypes.object.isRequired, actions: PropTypes.object.isRequired, hasUnfinishedSession: PropTypes.bool };

// Mobile Kit Profile: title with an Edit button, underline tabs, then one of three sections.
export default function MobileProfile({ data, state, actions }) {
  const [tab, setTab] = useState('profile');
  return (
    <MobileScreen
      title="Profile"
      subtitle="Manage your account and training preferences"
      headerAction={<Button variant="outlined" size="small" startIcon={<Edit3 size={16} />} onClick={actions.onEdit} sx={{ mt: 0.5, flexShrink: 0 }}>Edit</Button>}
    >
      {state.error ? <Alert severity="error" onClose={actions.onDismissError} sx={{ mb: 2 }}>{state.error}</Alert> : null}
      {state.success ? <Alert severity="success" onClose={actions.onDismissSuccess} sx={{ mb: 2 }}>{state.success}</Alert> : null}

      <MobileTabs
        variant="underline"
        ariaLabel="Profile sections"
        value={tab}
        onChange={setTab}
        sx={{ mb: 3 }}
        tabs={[
          { id: 'profile', label: 'Profile', icon: <User size={18} /> },
          { id: 'preferences', label: 'Preferences', icon: <Settings size={18} /> },
          { id: 'account', label: 'Account', icon: <Shield size={18} /> },
        ]}
      />

      {tab === 'profile' ? <ProfileSection userData={data.userData} stats={data.stats} statsLoading={state.statsLoading} preferences={data.preferences} />
        : tab === 'preferences' ? <PreferencesSection preferences={data.preferences} actions={actions} />
          : <AccountSection userData={data.userData} actions={actions} hasUnfinishedSession={data.hasUnfinishedSession} />}
    </MobileScreen>
  );
}

MobileProfile.propTypes = {
  data: PropTypes.shape({
    userData: PropTypes.object.isRequired,
    stats: PropTypes.shape({ totalWorkouts: PropTypes.number, currentStreak: PropTypes.number, thisWeek: PropTypes.number, caloriesBurned: PropTypes.number }).isRequired,
    preferences: PropTypes.object,
    notifications: PropTypes.object,
    hasUnfinishedSession: PropTypes.bool,
  }).isRequired,
  state: PropTypes.shape({ error: PropTypes.string, success: PropTypes.string, statsLoading: PropTypes.bool }).isRequired,
  actions: PropTypes.shape({
    onEdit: PropTypes.func.isRequired,
    onPreferenceChange: PropTypes.func.isRequired,
    onNotificationChange: PropTypes.func.isRequired,
    onExportData: PropTypes.func.isRequired,
    onClearCache: PropTypes.func.isRequired,
    onSignOut: PropTypes.func.isRequired,
    onDismissError: PropTypes.func,
    onDismissSuccess: PropTypes.func,
  }).isRequired,
};

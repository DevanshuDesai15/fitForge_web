import PropTypes from 'prop-types';
import { Flame, Target } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MobileHeroStat } from '../../mobile';

const panelSx = { p: 2, borderRadius: '16px', backgroundColor: '#2a2a2a' };
const panelTitleSx = { color: '#fff', fontWeight: 700, fontSize: '1rem', mb: 2.5 };
const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };

const ACHIEVEMENT_STYLE = {
  weekly: { Icon: Target, iconBg: '#dded00', iconColor: '#000', rowBg: 'rgba(221,237,0,0.08)' },
  record: { Icon: Flame, iconBg: '#fff', iconColor: '#000', rowBg: 'transparent' },
};

export default function MobileProgressOverview({ overview, weightUnit }) {
  const { weekVolume, volumeChange, weekDays, weeklyGoal, activeMinutes, streak, weeklyChart, achievements, consistency } = overview;
  const volume = weekVolume >= 1000 ? `${(weekVolume / 1000).toFixed(1)}k` : weekVolume.toFixed(0);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <MobileHeroStat
          value={volume}
          unit={`${weightUnit} this week`}
          delta={volumeChange ? `${volumeChange > 0 ? '+' : ''}${volumeChange}%` : undefined}
          caption="Volume lifted, week to date"
          stats={[
            { value: `${weekDays}/${weeklyGoal}`, label: 'weekly goal' },
            { value: activeMinutes, label: 'active minutes' },
            { value: streak, label: 'day streak' },
          ]}
        />
      </Box>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={panelSx}>
          <Typography sx={panelTitleSx}>Weekly Performance</Typography>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={weeklyChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }}
                formatter={(val) => [`${val} ${weightUnit}`, 'Volume']}
              />
              <Line type="monotone" dataKey="volume" stroke="#dded00" strokeWidth={2.5} dot={{ fill: '#dded00', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={panelSx}>
          <Typography sx={panelTitleSx}>Recent Achievements</Typography>
          {achievements.length === 0 ? (
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem', mb: 2 }}>Complete workouts to unlock achievements.</Typography>
          ) : achievements.map((a) => {
            const { Icon, iconBg, iconColor, rowBg } = ACHIEVEMENT_STYLE[a.kind];
            return (
              <Box key={a.kind} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5, mb: 1.5, borderRadius: '12px', backgroundColor: rowBg }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: iconBg, color: iconColor }}>
                  <Icon size={20} aria-hidden="true" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>{a.title}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', mt: 0.25 }}>
                    {a.kind === 'record' ? `New ${a.exerciseName} record: ${a.weight}${weightUnit}` : a.sub}
                  </Typography>
                </Box>
              </Box>
            );
          })}

          <Typography sx={{ ...panelTitleSx, fontSize: '0.95rem', mt: 2.5, mb: 1.5 }}>Consistency Insights</Typography>
          {consistency.map((row) => (
            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>{row.label}</Typography>
              <Typography sx={{ ...mono, color: row.highlight ? 'primary.main' : '#fff', fontWeight: 600, fontSize: '0.95rem' }}>{row.value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

MobileProgressOverview.propTypes = {
  overview: PropTypes.shape({
    weekVolume: PropTypes.number.isRequired,
    volumeChange: PropTypes.number.isRequired,
    weekDays: PropTypes.number.isRequired,
    weeklyGoal: PropTypes.number.isRequired,
    activeMinutes: PropTypes.number.isRequired,
    streak: PropTypes.number.isRequired,
    weeklyChart: PropTypes.array.isRequired,
    achievements: PropTypes.array.isRequired,
    consistency: PropTypes.array.isRequired,
  }).isRequired,
  weightUnit: PropTypes.string.isRequired,
};

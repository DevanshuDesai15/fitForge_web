import PropTypes from 'prop-types';
import { Check, History, Trophy } from 'lucide-react';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import MobileHeroStat from './MobileHeroStat';

const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
const cardSx = { p: 2, mb: 3, borderRadius: '18px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'background.paper' };

// The screen that closes a session: volume as the headline, records because they bring people back,
// then the week and what is next in the program. Presentational — buildFinishSummary supplies the data.
export default function MobileFinishSummary({ summary, weightUnit, onDone, onHistory }) {
  const { name, minutes, volume, sets, exercises, records, weekDone, weekTarget, program } = summary;
  const hitTarget = weekDone >= weekTarget;

  return (
    <Box sx={{ boxSizing: 'border-box', width: '100%', maxWidth: 920, mx: 'auto', px: 2, pt: 3.5, pb: 5 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ width: 88, height: 88, mx: 'auto', mb: 2.5, display: 'grid', placeItems: 'center', bgcolor: 'primary.main', color: 'primary.contrastText', clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' }}>
          <Check size={40} aria-hidden="true" />
        </Box>
        <Typography component="h1" sx={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.025em' }}>Session logged.</Typography>
        <Typography sx={{ mt: 1.25, color: 'text.secondary', fontSize: '1.05rem' }}>{name} · {minutes} min on the clock</Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <MobileHeroStat
          value={volume.toLocaleString()}
          unit={weightUnit}
          caption="Lifted this session"
          stats={[
            { value: sets, label: 'sets logged' },
            { value: exercises, label: 'exercises' },
            { value: `${minutes}m`, label: 'duration' },
          ]}
        />
      </Box>

      {records.length ? (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Trophy size={17} color="#dded00" aria-hidden="true" />
            <Typography component="h2" sx={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {records.length} personal record{records.length === 1 ? '' : 's'}
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            {records.map((record) => (
              <Box key={record.exercise} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.75, borderRadius: '14px', bgcolor: 'rgba(221,237,0,0.06)', border: '1px solid rgba(221,237,0,0.22)' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>{record.exercise}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.25 }}>{record.note}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography sx={{ ...mono, fontWeight: 700 }}>{record.detail}</Typography>
                  <Typography sx={{ ...mono, color: 'primary.main', fontSize: '0.85rem', mt: 0.25 }}>{record.delta}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      <Box sx={cardSx}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1.25 }}>
          <Typography sx={{ color: 'text.secondary' }}>This week</Typography>
          <Typography sx={{ ...mono, fontWeight: 700, color: hitTarget ? 'primary.main' : 'text.primary' }}>{weekDone} / {weekTarget}</Typography>
        </Box>
        <LinearProgress variant="determinate" value={Math.min(100, (weekDone / weekTarget) * 100)} aria-label="Weekly target progress" />
        <Typography sx={{ mt: 1.25, fontSize: '0.85rem', color: hitTarget ? 'primary.main' : 'text.secondary' }}>
          {hitTarget ? 'Weekly target hit. Anything else this week is a bonus.' : `${weekTarget - weekDone} more to hit your target.`}
        </Typography>
      </Box>

      {program ? (
        <Box sx={{ ...cardSx, mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(221,237,0,0.15)', color: 'primary.main' }}>
            <Check size={18} aria-hidden="true" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{program.name} · day {program.dayIndex} of {program.dayCount} done</Typography>
            <Typography sx={{ fontWeight: 700, mt: 0.25 }}>Next up: {program.nextDay}</Typography>
          </Box>
        </Box>
      ) : null}

      <Box sx={{ display: 'grid', gap: 1.25 }}>
        <Button fullWidth size="large" variant="contained" onClick={onDone} sx={{ color: 'primary.contrastText', fontWeight: 800 }}>Done</Button>
        <Button fullWidth variant="text" startIcon={<History size={17} />} onClick={onHistory}>See it in history</Button>
      </Box>
    </Box>
  );
}

MobileFinishSummary.propTypes = {
  summary: PropTypes.shape({
    name: PropTypes.string.isRequired,
    minutes: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    sets: PropTypes.number.isRequired,
    exercises: PropTypes.number.isRequired,
    records: PropTypes.array.isRequired,
    weekDone: PropTypes.number.isRequired,
    weekTarget: PropTypes.number.isRequired,
    program: PropTypes.shape({ name: PropTypes.string, dayIndex: PropTypes.number, dayCount: PropTypes.number, nextDay: PropTypes.string }),
  }).isRequired,
  weightUnit: PropTypes.string.isRequired,
  onDone: PropTypes.func.isRequired,
  onHistory: PropTypes.func.isRequired,
};

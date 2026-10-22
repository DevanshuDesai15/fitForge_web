import { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { Alert, Box, Button, ButtonBase, IconButton, TextField, Typography } from '@mui/material';
import { MobileScreen } from '../../components/mobile';
import {
  editSet,
  formatDuration,
  getSetWeight,
  getWorkoutDate,
  getWorkoutFallbackUnit,
  getWorkoutSeconds,
  getWorkoutSetCount,
  getWorkoutVolume,
} from './historyActivity';

const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
const rowSx = { display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 48, px: 1.5, borderRadius: '10px', border: '1px solid', borderColor: 'border.main', backgroundColor: '#2a2a2a' };

// Tapping a set turns that row into two fields; nothing else on the screen changes mode.
// onSave(nextExercises) / onDelete() are async and may throw — the error is shown inline.
export default function MobileSessionDetail({ workout, weightUnit, onBack, onSave, onDelete }) {
  const [editing, setEditing] = useState(null); // { ei, si }
  const [draft, setDraft] = useState({ weight: '', reps: '' });
  const [notice, setNotice] = useState(null); // { tone, text }
  const [busy, setBusy] = useState(false);

  const date = getWorkoutDate(workout);
  const fallbackUnit = getWorkoutFallbackUnit(workout);
  const exercises = workout.exercises || [];
  const volume = Math.round(getWorkoutVolume(workout, weightUnit)).toLocaleString();
  const subtitle = `${formatDuration(getWorkoutSeconds(workout))} · ${getWorkoutSetCount(workout)} sets · ${volume} ${weightUnit}`;

  const open = (ei, si) => {
    const set = exercises[ei].sets[si];
    const weight = getSetWeight(set, fallbackUnit, weightUnit);
    setDraft({ weight: weight === null ? '' : String(weight), reps: String(set.reps ?? '') });
    setEditing({ ei, si });
    setNotice(null);
  };

  const run = async (action) => {
    setBusy(true);
    try {
      return await action();
    } catch (err) {
      setNotice({ tone: 'error', text: `Could not save: ${err.message || err}` });
      return undefined;
    } finally {
      setBusy(false);
    }
  };

  const commit = async (patch) => {
    const { ei, si } = editing;
    const result = await run(() => onSave(editSet(exercises, ei, si, patch, weightUnit)));
    if (result === undefined) return; // failed — keep the editor open with the error
    setEditing(null);
    setNotice(result?.fallenRecord
      ? { tone: 'warning', text: `${result.fallenRecord.exercise} corrected — the ${result.fallenRecord.from} ${weightUnit} personal record from this session no longer stands. Your best is now ${result.fallenRecord.to} ${weightUnit}. Records have been recalculated from the sets that remain.` }
      : { tone: 'success', text: patch === null ? 'Set removed. Volume and records recalculated.' : 'Set updated. Volume and records recalculated.' });
  };

  const save = () => {
    const reps = parseInt(draft.reps, 10);
    const set = exercises[editing.ei].sets[editing.si];
    const weight = parseFloat(draft.weight);
    if (!(reps > 0) || (set.weightType !== 'bodyweight' && !(weight >= 0))) {
      setNotice({ tone: 'error', text: 'Enter a valid weight and rep count.' });
      return;
    }
    commit({ weight, reps });
  };

  const remove = async () => {
    if (!window.confirm('Delete this session? Its sets, volume and any records set here will be removed. This cannot be undone.')) return;
    if ((await run(async () => { await onDelete(); return true; })) === true) onBack();
  };

  return (
    <MobileScreen
      title={date ? format(date, 'MMM d, yyyy') : 'Workout'}
      subtitle={subtitle}
      backAction={onBack}
      headerAction={(
        <IconButton aria-label="Delete session" disabled={busy} onClick={remove} sx={{ width: 44, height: 44 }}>
          <Trash2 size={20} />
        </IconButton>
      )}
    >
      {notice ? (
        <Alert severity={notice.tone} sx={{ mb: 2.5 }}>{notice.text}</Alert>
      ) : (
        <Typography sx={{ mb: 2.5, color: 'text.secondary', fontSize: '0.85rem' }}>
          Tap any set to correct it. Records and weekly volume follow the change.
        </Typography>
      )}

      <Box sx={{ display: 'grid', gap: 1.75 }}>
        {exercises.map((exercise, ei) => (
          <Box key={ei} sx={{ p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1.5, mb: 1.5 }}>
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 700 }}>{exercise.name || exercise.exerciseName}</Typography>
              <Typography sx={{ ...mono, color: 'text.secondary', fontSize: '0.85rem' }}>{(exercise.sets || []).length} sets</Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 1 }}>
              {(exercise.sets || []).map((set, si) => {
                const weight = getSetWeight(set, fallbackUnit, weightUnit);
                if (editing && editing.ei === ei && editing.si === si) {
                  return (
                    <Box key={si} sx={{ p: 1.5, borderRadius: '10px', border: '1px solid', borderColor: 'primary.main', backgroundColor: 'rgba(221,237,0,0.06)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                        <Typography sx={{ ...mono, width: 46, color: 'primary.main', fontSize: '0.85rem' }}>SET {si + 1}</Typography>
                        {set.weightType === 'bodyweight' ? (
                          <Typography sx={{ flex: 1, textAlign: 'center', color: 'text.secondary' }}>Bodyweight</Typography>
                        ) : (
                          <TextField size="small" label={`Weight (${weightUnit})`} value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: e.target.value })} inputProps={{ inputMode: 'decimal' }} sx={{ flex: 1 }} />
                        )}
                        <TextField size="small" label="Reps" value={draft.reps} onChange={(e) => setDraft({ ...draft, reps: e.target.value })} inputProps={{ inputMode: 'numeric' }} sx={{ flex: 1 }} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="contained" startIcon={<Check size={16} />} disabled={busy} onClick={save} sx={{ flex: 1 }}>Save set</Button>
                        <Button size="small" disabled={busy} onClick={() => setEditing(null)}>Cancel</Button>
                        <Button size="small" color="error" startIcon={<Trash2 size={16} />} disabled={busy} onClick={() => commit(null)}>Delete</Button>
                      </Box>
                    </Box>
                  );
                }
                return (
                  <ButtonBase key={si} aria-label={`Edit set ${si + 1} of ${exercise.name || exercise.exerciseName}`} onClick={() => open(ei, si)} sx={{ ...rowSx, width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}>
                    <Typography sx={{ ...mono, width: 46, color: 'text.secondary', fontSize: '0.85rem' }}>SET {si + 1}</Typography>
                    <Typography sx={{ ...mono, flex: 1, fontSize: '1.05rem', fontWeight: 700 }}>
                      {weight === null ? 'Bodyweight' : `${weight} ${weightUnit}`}
                      <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}> × {set.reps}</Box>
                    </Typography>
                    <Pencil size={15} aria-hidden="true" />
                  </ButtonBase>
                );
              })}
            </Box>
            {exercise.notes ? (
              <Typography sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'border.main', color: 'text.secondary', fontSize: '0.95rem', lineHeight: 1.5 }}>
                {exercise.notes}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Box>
    </MobileScreen>
  );
}

MobileSessionDetail.propTypes = {
  workout: PropTypes.shape({ exercises: PropTypes.array }).isRequired,
  weightUnit: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

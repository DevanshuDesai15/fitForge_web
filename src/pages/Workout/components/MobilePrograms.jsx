import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, ButtonBase, Card, Chip, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { ArrowLeft, CalendarDays, Check, ChevronRight, Dumbbell, Layers3, Pencil, Play, Plus, Repeat2, Search, Timer, Trash2 } from 'lucide-react';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const programShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  category: PropTypes.string,
  difficulty: PropTypes.string,
  frequency: PropTypes.string,
  duration: PropTypes.string,
  days: PropTypes.array,
});

function getNextDay(program) {
  const days = Array.isArray(program.days) ? program.days : [];
  return days.find((day) => !day.completed) || days[0] || null;
}

function getExerciseCount(program) {
  return (program.days || []).reduce((total, day) => total + (day.exercises?.length || 0), 0);
}

const outlineChipSx = {
  height: 28,
  borderColor: 'border.main',
  color: 'text.primary',
  fontWeight: 700,
  '& .MuiChip-icon': { color: 'text.primary' },
};

function ProgramMeta({ program }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {program.category ? <Chip label={program.category} size="small" sx={{ height: 28, bgcolor: 'rgba(221,237,0,0.16)', color: 'primary.main', fontWeight: 700 }} /> : null}
      {program.difficulty ? <Chip label={program.difficulty} size="small" variant="outlined" sx={outlineChipSx} /> : null}
      {program.frequency ? <Chip icon={<Repeat2 size={15} />} label={program.frequency} size="small" variant="outlined" sx={outlineChipSx} /> : null}
      {program.duration ? <Chip icon={<CalendarDays size={15} />} label={program.duration} size="small" variant="outlined" sx={outlineChipSx} /> : null}
    </Box>
  );
}

ProgramMeta.propTypes = { program: programShape.isRequired };

export function MobileProgramDetail({ program, onBack, onStart, onEdit, onOpenDay, onAddDay, onDelete }) {
  const days = program.days || [];
  const nextDay = getNextDay(program);
  const exerciseCount = getExerciseCount(program);

  return (
    <Box>
      <Box component="header" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 2.5 }}>
        <IconButton aria-label="Back to programs" onClick={onBack} sx={{ mt: -0.5 }}><ArrowLeft /></IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h1" sx={{ fontSize: '1.65rem', lineHeight: 1.1, fontWeight: 800 }}>{program.name}</Typography>
          {program.description ? <Typography sx={{ mt: 0.75, color: 'text.secondary', lineHeight: 1.45 }}>{program.description}</Typography> : null}
        </Box>
        <IconButton aria-label="Edit program" onClick={onEdit} sx={{ mt: -0.5, mr: { xs: 5.5, sm: 6 } }}><Pencil /></IconButton>
      </Box>

      <Box sx={{ mb: 2.5 }}><ProgramMeta program={program} /></Box>

      {nextDay ? (
        <Card sx={{ mb: 3, p: 2, borderRadius: '18px', borderColor: 'rgba(221,237,0,0.22)', bgcolor: 'rgba(221,237,0,0.06)', backgroundImage: 'none' }}>
          <Typography sx={{ color: 'primary.main', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Up next</Typography>
          <Typography sx={{ mt: 0.75, fontSize: '1.5rem', lineHeight: 1.1, fontWeight: 800 }}>{nextDay.name}</Typography>
          {nextDay.focus ? <Typography sx={{ mt: 0.75, color: 'text.secondary' }}>{nextDay.weekday ? `${nextDay.weekday} · ` : ''}{nextDay.focus}</Typography> : null}
          <Box sx={{ display: 'flex', gap: 0.75, my: 1.75 }}>
            <Chip icon={<Dumbbell size={15} />} label={`${nextDay.exercises?.length || 0} exercises`} size="small" variant="outlined" sx={outlineChipSx} />
            <Chip icon={<Timer size={15} />} label={`~${Number(nextDay.duration) || (nextDay.exercises?.length || 0) * 5 + 10} min`} size="small" sx={{ height: 28, bgcolor: 'rgba(221,237,0,0.16)', color: 'primary.main', fontWeight: 700 }} />
          </Box>
          <Button fullWidth variant="contained" startIcon={<Play size={18} />} onClick={() => onStart(program, nextDay)} sx={{ color: 'primary.contrastText', fontWeight: 800 }}>
            Start {nextDay.name}
          </Button>
        </Card>
      ) : null}

      {days.some((day) => day.weekday) ? (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: { xs: 0.5, sm: 0.75 } }}>
            {weekDays.map((weekday) => {
              const day = days.find((candidate) => candidate.weekday === weekday);
              return (
                <Box key={weekday} sx={{ minWidth: 0, py: 1, px: 0.25, textAlign: 'center', border: '1px solid', borderColor: day ? 'rgba(221,237,0,0.32)' : 'border.main', borderRadius: '12px', bgcolor: day ? 'rgba(221,237,0,0.06)' : 'background.paper' }}>
                  <Typography sx={{ color: day ? 'primary.main' : 'text.secondary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: { xs: '0.58rem', sm: '0.7rem' }, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{weekday}</Typography>
                  <Typography sx={{ mt: 0.5, color: day ? 'text.primary' : 'text.secondary', fontSize: { xs: '0.62rem', sm: '0.76rem' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{day?.name || 'Rest'}</Typography>
                </Box>
              );
            })}
          </Box>
          <Typography sx={{ mt: 1, color: 'text.secondary', fontSize: '0.78rem' }}>{days.filter((day) => day.weekday).length} training days · {7 - days.filter((day) => day.weekday).length} rest</Typography>
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography component="h2" sx={{ fontSize: '1.45rem', fontWeight: 800 }}>Days</Typography>
        <Typography sx={{ color: 'text.secondary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.78rem' }}>{days.length} · {exerciseCount} exercises</Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {days.map((day, index) => (
          <Card key={day.id || index} sx={{ bgcolor: 'background.paper', backgroundImage: 'none' }}>
            <ButtonBase aria-label={`Open ${day.name} day`} onClick={() => onOpenDay(day)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', p: 1.5, textAlign: 'left' }}>
            <Box sx={{ width: 38, height: 38, flexShrink: 0, display: 'grid', placeItems: 'center', borderRadius: '10px', bgcolor: day.completed ? 'rgba(221,237,0,0.14)' : 'rgba(0,0,0,0.18)', color: day.completed ? 'primary.main' : 'text.secondary', fontWeight: 800 }}>
              {day.completed ? <Check size={18} /> : (day.weekday || index + 1)}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800 }}>{day.name}</Typography>
              <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{day.focus || 'No focus set'}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.78rem' }}>{day.exercises?.length || 0} ex</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>~{Number(day.duration) || (day.exercises?.length || 0) * 5 + 10} min</Typography>
            </Box>
            <ChevronRight size={19} color="var(--text-secondary)" aria-hidden="true" />
            </ButtonBase>
          </Card>
        ))}
        <Button variant="outlined" startIcon={<Plus size={19} />} onClick={onAddDay} sx={{ minHeight: 58, borderStyle: 'dashed', fontSize: '1rem', fontWeight: 800 }}>Add a day</Button>
      </Box>

      <Button fullWidth variant="outlined" color="error" startIcon={<Trash2 size={19} />} onClick={onDelete} sx={{ mt: 3, minHeight: 52, bgcolor: 'rgba(239,68,68,0.13)', fontWeight: 800 }}>Delete program</Button>
    </Box>
  );
}

MobileProgramDetail.propTypes = {
  program: programShape.isRequired,
  onBack: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onOpenDay: PropTypes.func.isRequired,
  onAddDay: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function MobilePrograms({ programs, loading = false, error = '', onRetry, onOpen, onStart, onNew }) {
  const [query, setQuery] = useState('');
  const filteredPrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? programs.filter((program) => program.name.toLowerCase().includes(normalizedQuery))
      : programs;
  }, [programs, query]);

  if (loading) {
    return <Box aria-label="Loading programs" aria-busy="true" sx={{ minHeight: 220 }} />;
  }

  if (error) {
    return (
      <Box role="alert" sx={{ p: 3, textAlign: 'center' }}>
        <Typography sx={{ mb: 2 }}>Could not load programs.</Typography>
        <Button onClick={onRetry}>Retry</Button>
      </Box>
    );
  }

  if (!programs.length) {
    return (
      <Box sx={{ minHeight: 260, display: 'grid', placeItems: 'center', textAlign: 'center', px: 2 }}>
        <Box>
          <CalendarDays size={30} aria-hidden="true" />
          <Typography component="h2" sx={{ mt: 1.5, fontSize: '1.2rem', fontWeight: 800 }}>No programs yet</Typography>
          <Typography sx={{ my: 1.5, color: 'text.secondary', lineHeight: 1.5 }}>
            A program groups your training days so the app always knows what you are doing next.
          </Typography>
          <Button variant="contained" startIcon={<Plus size={18} />} onClick={onNew}>Build your first program</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <TextField
        fullWidth
        placeholder="Search programs"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        inputProps={{ 'aria-label': 'Search programs' }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search size={19} /></InputAdornment> }}
        sx={{ '& .MuiOutlinedInput-root': { minHeight: 52, borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.16)' } }}
      />

      {filteredPrograms.map((program) => {
        const days = program.days || [];
        const nextDay = getNextDay(program);
        const exerciseCount = getExerciseCount(program);

        return (
          <Card key={program.id} sx={{ p: 2, borderRadius: '16px', backgroundColor: 'background.paper', backgroundImage: 'none' }}>
            <ButtonBase
              aria-label={`Open ${program.name}`}
              onClick={() => onOpen(program.id)}
              sx={{ display: 'block', width: '100%', textAlign: 'left', borderRadius: '10px' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography component="h2" sx={{ fontSize: '1.45rem', lineHeight: 1.15, fontWeight: 800 }}>{program.name}</Typography>
                  {program.description ? <Typography sx={{ mt: 0.75, color: 'text.secondary', lineHeight: 1.45 }}>{program.description}</Typography> : null}
                </Box>
                <ChevronRight size={22} color="var(--text-secondary)" aria-hidden="true" />
              </Box>

              <Box sx={{ my: 1.5 }}><ProgramMeta program={program} /></Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {days.map((day, index) => (
                  <Chip
                    key={day.id || index}
                    label={`${day.weekday || index + 1} ${day.name}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 28, borderColor: 'border.main', color: 'text.secondary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 1.5, color: 'text.secondary' }}>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.6, fontSize: '0.82rem' }}><Layers3 size={14} />{days.length} days</Typography>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.6, fontSize: '0.82rem' }}><Dumbbell size={14} />{exerciseCount} exercises</Typography>
              </Box>
            </ButtonBase>

            {nextDay ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.75, pt: 1.75, borderTop: '1px solid', borderColor: 'border.main' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ color: 'primary.main', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase' }}>Up next</Typography>
                  <Typography sx={{ mt: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nextDay.name}{nextDay.focus ? ` · ${nextDay.focus}` : ''}
                  </Typography>
                </Box>
                <Button variant="contained" startIcon={<Play size={17} />} onClick={() => onStart(program, nextDay)} aria-label={`Start ${nextDay.name}`} sx={{ color: 'primary.contrastText', fontWeight: 800, borderRadius: '10px' }}>
                  Start
                </Button>
              </Box>
            ) : null}
          </Card>
        );
      })}

      {!filteredPrograms.length ? (
        <Card sx={{ p: 2, textAlign: 'center', backgroundColor: 'background.paper', backgroundImage: 'none' }}>
          <Typography sx={{ color: 'text.secondary' }}>No programs match “{query}”.</Typography>
        </Card>
      ) : null}

      <Button variant="outlined" startIcon={<Plus size={18} />} onClick={onNew} sx={{ minHeight: 48, borderStyle: 'dashed' }}>New program</Button>
    </Box>
  );
}

MobilePrograms.propTypes = {
  programs: PropTypes.arrayOf(programShape).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  onOpen: PropTypes.func.isRequired,
  onStart: PropTypes.func.isRequired,
  onNew: PropTypes.func.isRequired,
};

import { useEffect, useState } from 'react';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Info,
  PlayCircle,
  Repeat,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useWorkoutReader } from '../../../hooks/useWorkouts';
import { MobileState, MobileTabs } from '../../../components/mobile';

function useExerciseSessions(exerciseName) {
  const { currentUser } = useAuth();
  const readWorkouts = useWorkoutReader();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!currentUser?.uid || !exerciseName) {
        if (active) {
          setSessions([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const workouts = await readWorkouts({ columns: 'id, exercises, weight_unit, timestamp, created_at' });
        const key = exerciseName.trim().toLowerCase();
        const matches = [];

        for (const workout of workouts || []) {
          for (const exercise of workout.exercises || []) {
            const name = exercise?.name || exercise?.exerciseName;
            if ((name || '').trim().toLowerCase() !== key) continue;

            const completedSets = (exercise.sets || []).filter((set) => set?.completed !== false);
            if (!completedSets.length) continue;

            const weights = completedSets.map((set) => Number(set.weight) || 0);
            matches.push({
              date: workout.timestamp || workout.createdAt || workout.created_at,
              setCount: completedSets.length,
              reps: completedSets[0]?.reps,
              weight: Math.max(...weights),
              unit: completedSets[0]?.weightUnit || workout.weightUnit || workout.weight_unit || 'lbs',
            });
          }
        }

        matches.sort((a, b) => new Date(b.date) - new Date(a.date));
        const topWeight = matches.reduce((max, session) => Math.max(max, session.weight), 0);

        if (active) {
          setSessions(matches.slice(0, 3).map((session) => ({ ...session, isPR: topWeight > 0 && session.weight === topWeight })));
        }
      } catch (error) {
        console.error('Failed to load exercise sessions:', error);
        if (active) setSessions([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [currentUser?.uid, exerciseName, readWorkouts]);

  return { sessions, loading };
}

function StatBlock({ icon: Icon, label, value }) {
  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Box sx={{ width: 46, height: 46, mx: 'auto', mb: 1, borderRadius: '10px', border: '1px solid rgba(221,237,0,0.32)', display: 'grid', placeItems: 'center' }}>
        <Icon size={19} color="var(--mui-palette-primary-main, #dded00)" />
      </Box>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>{label}</Typography>
      <Typography sx={{ mt: 0.25, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 700, fontSize: '1.05rem' }}>{value}</Typography>
    </Box>
  );
}

function NoteList({ items, tone, Icon }) {
  const toneStyles = {
    accent: { bg: 'rgba(221,237,0,0.06)', border: 'rgba(221,237,0,0.22)', color: 'primary.main' },
    warning: { bg: 'rgba(234,179,8,0.10)', border: 'rgba(234,179,8,0.30)', color: '#facc15' },
    error: { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)', color: '#f87171' },
  }[tone];

  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      {items.map((item, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 1.25, p: 1.5, borderRadius: '10px', backgroundColor: toneStyles.bg, border: '1px solid', borderColor: toneStyles.border }}>
          <Icon size={15} color="currentColor" style={{ flexShrink: 0, marginTop: 2, color: toneStyles.color }} />
          <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.5 }}>{item}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function MobileExerciseDetail({ exercise, onBack }) {
  const [tab, setTab] = useState('overview');

  const name = exercise.title || exercise.name || 'Exercise';
  const description = exercise.description || '';
  const steps = exercise.steps || [];
  const proTips = exercise.proTips || exercise.pro_tips || [];
  const commonMistakes = exercise.commonMistakes || exercise.common_mistakes || [];
  const primaryMuscle = exercise.primary_muscle || exercise.primaryMuscle || '';
  const secondaryMuscles = exercise.secondary_muscles || exercise.secondaryMuscles || [];
  const equipment = (Array.isArray(exercise.equipmentNeeded || exercise.equipment_needed || exercise.equipment)
    ? (exercise.equipmentNeeded || exercise.equipment_needed || exercise.equipment)
    : [exercise.equipmentNeeded || exercise.equipment_needed || exercise.equipment]).filter(Boolean);
  const videoUrls = exercise.videoUrls || exercise.video_urls || {};
  const variations = exercise.variations || [];
  const safetyConsiderations = exercise.safetyConsiderations || exercise.safety_considerations || [];
  const tags = exercise.tags || [];
  const videoUrl = videoUrls['720p'] || videoUrls['480p'];

  const { sessions, loading: sessionsLoading } = useExerciseSessions(name);

  const has = {
    steps: steps.length > 0,
    demo: !!videoUrl,
    tips: proTips.length > 0 || commonMistakes.length > 0 || safetyConsiderations.length > 0 || variations.length > 0,
  };
  const tabs = [{ id: 'overview', label: 'Overview' }]
    .concat(has.steps ? [{ id: 'steps', label: 'Steps' }] : [])
    .concat(has.demo ? [{ id: 'demo', label: 'Demo' }] : [])
    .concat(has.tips ? [{ id: 'tips', label: 'Tips' }] : []);
  const sparse = tabs.length === 1;
  const activeTab = tabs.some((candidate) => candidate.id === tab) ? tab : 'overview';

  return (
    <Box>
      <Box component="header" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 2.5 }}>
        <IconButton aria-label="Back to library" onClick={onBack} sx={{ mt: -0.5 }}><ArrowLeft /></IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h1" sx={{ fontSize: '1.65rem', lineHeight: 1.1, fontWeight: 800 }}>{name}</Typography>
          {primaryMuscle ? (
            <Typography sx={{ mt: 0.75, color: 'text.secondary' }}>
              {primaryMuscle}{equipment[0] ? ` · ${equipment[0]}` : ''}
            </Typography>
          ) : null}
        </Box>
      </Box>

      {tabs.length > 1 ? (
        <MobileTabs
          tabs={tabs}
          value={activeTab}
          onChange={setTab}
          variant="underline"
          ariaLabel="Exercise detail sections"
          sx={{ mb: 3 }}
        />
      ) : null}

      {activeTab === 'overview' ? (
        <Box sx={{ display: 'grid', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', p: 2, borderRadius: '16px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'background.paper' }}>
            <StatBlock icon={Target} label="Target sets" value="3" />
            <StatBlock icon={Zap} label="Target reps" value="10" />
            <StatBlock icon={Clock} label="Rest" value="1:00" />
          </Box>

          {description ? (
            <Box>
              <Typography component="h2" sx={{ fontSize: '1.25rem', fontWeight: 800, mb: 1 }}>What it is</Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{description}</Typography>
            </Box>
          ) : null}

          {primaryMuscle || secondaryMuscles.length ? (
            <Box>
              <Typography component="h2" sx={{ fontSize: '1.25rem', fontWeight: 800, mb: 1 }}>Muscles worked</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {primaryMuscle ? <Chip label={primaryMuscle} size="small" sx={{ bgcolor: 'rgba(221,237,0,0.16)', color: 'primary.main', fontWeight: 700 }} /> : null}
                {secondaryMuscles.map((muscle) => (
                  <Chip key={muscle} label={muscle} size="small" variant="outlined" sx={{ borderColor: 'border.main', color: 'text.secondary' }} />
                ))}
              </Box>
            </Box>
          ) : null}

          <Box>
            <Typography component="h2" sx={{ fontSize: '1.25rem', fontWeight: 800, mb: 1 }}>Your last sessions</Typography>
            {sessionsLoading ? (
              <MobileState kind="loading" />
            ) : sessions.length ? (
              <Box sx={{ display: 'grid', gap: 1 }}>
                {sessions.map((session) => (
                  <Box key={session.date} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '10px', backgroundColor: 'rgba(0,0,0,0.16)', border: '1px solid', borderColor: 'border.main' }}>
                    <Typography sx={{ width: 78, flexShrink: 0, color: 'text.secondary', fontSize: '0.85rem' }}>
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Typography>
                    <Typography sx={{ flex: 1, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.9rem' }}>
                      {session.setCount} × {session.reps} @ {session.weight}{session.unit}
                    </Typography>
                    {session.isPR ? <Chip icon={<Trophy size={13} />} label="PR" size="small" sx={{ bgcolor: 'rgba(221,237,0,0.16)', color: 'primary.main', fontWeight: 800 }} /> : null}
                  </Box>
                ))}
              </Box>
            ) : (
              <MobileState kind="empty" title="You haven't logged this one yet." message="Once you do, your last three sessions with it show here." />
            )}
          </Box>

          {equipment.length || tags.length ? (
            <Box sx={{ display: 'flex', gap: 3 }}>
              {equipment.length ? (
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, mb: 1, fontSize: '0.9rem' }}>Equipment</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {equipment.map((item) => <Chip key={item} label={item} size="small" variant="outlined" sx={{ borderColor: 'border.main', color: 'text.secondary' }} />)}
                  </Box>
                </Box>
              ) : null}
              {tags.length ? (
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, mb: 1, fontSize: '0.9rem' }}>Tags</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {tags.map((tag) => <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderColor: 'border.main', color: 'text.secondary' }} />)}
                  </Box>
                </Box>
              ) : null}
            </Box>
          ) : null}

          {sparse ? (
            <Box sx={{ display: 'flex', gap: 1.25, p: 1.75, borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.16)', border: '1px solid', borderColor: 'border.main' }}>
              <Info size={16} color="var(--mui-palette-text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.5 }}>
                No instructions, clip or coaching notes in the catalog for this one{exercise.isCustom ? ' — custom exercises never have them' : ''}. Everything above comes from your own training.
              </Typography>
            </Box>
          ) : null}
        </Box>
      ) : activeTab === 'steps' ? (
        <Box sx={{ display: 'grid', gap: 1.75 }}>
          {steps.map((step, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start' }}>
              <Box sx={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', backgroundColor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                {index + 1}
              </Box>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.6, pt: 0.5 }}>{step}</Typography>
            </Box>
          ))}
        </Box>
      ) : activeTab === 'demo' ? (
        <Box>
          <Box sx={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid', borderColor: 'border.main', backgroundColor: '#000' }}>
            {videoUrl ? (
              <video src={videoUrl} controls loop muted style={{ width: '100%', maxHeight: 360, display: 'block' }} />
            ) : (
              <Box sx={{ height: 220, display: 'grid', placeItems: 'center', gap: 1 }}>
                <PlayCircle size={40} color="var(--mui-palette-text-secondary)" />
                <Typography sx={{ color: 'text.secondary' }}>Video demo not available</Typography>
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 3 }}>
          {proTips.length ? (
            <Box>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, mb: 1.25 }}>
                <CheckCircle size={17} color="#4ade80" /> Pro tips
              </Typography>
              <NoteList items={proTips} tone="accent" Icon={CheckCircle} />
            </Box>
          ) : null}

          {commonMistakes.length ? (
            <Box>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, mb: 1.25 }}>
                <AlertTriangle size={17} color="#facc15" /> Common mistakes
              </Typography>
              <NoteList items={commonMistakes} tone="warning" Icon={AlertTriangle} />
            </Box>
          ) : null}

          {safetyConsiderations.length ? (
            <Box>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, mb: 1.25 }}>
                <AlertTriangle size={17} color="#f87171" /> Safety
              </Typography>
              <NoteList items={safetyConsiderations} tone="error" Icon={AlertTriangle} />
            </Box>
          ) : null}

          {variations.length ? (
            <Box>
              <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, mb: 1.25 }}>
                <Repeat size={17} /> Variations
              </Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                {variations.map((variation) => (
                  <Box key={variation} sx={{ p: 1.5, borderRadius: '10px', backgroundColor: 'background.paper', border: '1px solid', borderColor: 'border.main' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem' }}>{variation}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
}

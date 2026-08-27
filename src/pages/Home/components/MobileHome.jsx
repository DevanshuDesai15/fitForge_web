import PropTypes from 'prop-types';
import { Activity, Brain, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { Avatar, Box, ButtonBase, Card, CardContent, Chip, Typography } from '@mui/material';
import { MobileHeroStat, MobileScreen, MobileSection, MobileState } from '../../../components/mobile';
import AIUnlockProgress from './AIUnlockProgress';
import WeeklyTargetsGrid from './WeeklyTargetsGrid';

const achievementIcons = {
  target: Target,
  'trending-up': TrendingUp,
  zap: Zap,
  activity: Activity,
};

const recommendationIcons = {
  weight: TrendingUp,
  reps: Brain,
  deload: Clock,
};

export default function MobileHome({ data, state, actions }) {
  const {
    displayName,
    avatarUrl,
    greeting,
    weeklyStats,
    achievements,
    aiRecommendations,
    completedWorkoutsCount,
    workoutsUntilAiUnlock,
    isAiUnlocked,
  } = data;

  return (
    <MobileScreen>
      <Box component="header" sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 4 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '1rem', lineHeight: 1.3 }}>{greeting}</Typography>
          <Typography component="h1" sx={{ mt: 0.5, fontSize: { xs: '2.25rem', sm: '2.6rem' }, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.025em' }}>
            {displayName}
          </Typography>
        </Box>
        <ButtonBase
          aria-label="Open profile"
          onClick={actions.onOpenProfile}
          sx={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid', borderColor: 'border.strong', backgroundColor: 'background.paper' }}
        >
          <Avatar src={avatarUrl || undefined} alt="" sx={{ width: 46, height: 46, bgcolor: 'background.paper', color: 'text.primary', fontWeight: 800 }}>
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
        </ButtonBase>
      </Box>

      {state.error ? (
        <MobileState kind="failure" title="Could not load your dashboard" message={String(state.error.message || state.error)} onRetry={actions.onRetry} />
      ) : state.loading ? (
        <MobileSection title="Weekly Targets">
          <MobileState kind="loading" title="Loading your dashboard" />
        </MobileSection>
      ) : (
        <>
          <MobileSection title="Weekly Targets">
            <WeeklyTargetsGrid weeklyStats={weeklyStats} mobileKit />
          </MobileSection>

          <MobileSection title="This Week">
            <MobileHeroStat
              value={weeklyStats.totalVolume.toLocaleString()}
              unit={weeklyStats.volumeUnit}
              caption={`Lifted this week · ${weeklyStats.goalText} workouts toward your goal`}
              stats={[
                { value: `${Math.round(weeklyStats.goalProgress)}%`, label: 'of weekly goal' },
                { value: weeklyStats.streakDays, label: 'day streak' },
                { value: weeklyStats.activeMinutes, label: 'active minutes' },
              ]}
            />
          </MobileSection>

          <MobileSection title="Recent Achievements">
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {achievements?.length ? achievements.slice(0, 3).map((achievement) => {
                const Icon = achievementIcons[achievement.icon] || Target;
                const accent = achievement.variant === 'primary';
                return (
                  <Card key={achievement.id} sx={{ borderColor: accent ? 'rgba(221,237,0,0.34)' : 'border.main', background: accent ? 'rgba(221,237,0,0.07)' : 'background.paper' }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: '14px !important' }}>
                      <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: accent ? 'primary.main' : 'rgba(255,255,255,0.08)', color: accent ? 'primary.contrastText' : 'text.primary' }}>
                        <Icon size={21} aria-hidden="true" />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>{achievement.title}</Typography>
                        <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.82rem' }}>{achievement.description}</Typography>
                      </Box>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{achievement.timeAgo}</Typography>
                    </CardContent>
                  </Card>
                );
              }) : (
                <MobileState kind="empty" title="Complete workouts to unlock achievements!" />
              )}
            </Box>
          </MobileSection>

          <MobileSection title="Quick Actions">
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
              {[
                { label: 'Quick HIIT', icon: Zap, action: actions.onQuickWorkout },
                { label: 'Log Activity', icon: Activity, action: actions.onLogActivity },
                { label: 'Set Goal', icon: Target, action: actions.onSetGoal },
              ].map(({ label, icon: Icon, action }) => (
                <ButtonBase key={label} onClick={action} sx={{ minHeight: 92, p: 1.25, borderRadius: '14px', border: '1px solid', borderColor: 'border.main', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Icon size={25} color="var(--primary-a0)" aria-hidden="true" />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{label}</Typography>
                </ButtonBase>
              ))}
            </Box>
          </MobileSection>

          <Box component="section" sx={{ mb: 4 }}>
            <Card sx={{ borderRadius: '18px', backgroundColor: 'background.paper', backgroundImage: 'none' }}>
              <CardContent sx={{ p: { xs: '16px !important', sm: '22px !important' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2.5 }}>
                  <Brain size={20} color="var(--primary-a0)" aria-hidden="true" />
                  <Typography component="h2" sx={{ fontSize: '1.25rem', fontWeight: 500 }}>AI Recommendations</Typography>
                </Box>
                {state.aiLoading ? (
                  <MobileState kind="loading" title="Loading AI recommendations" />
                ) : state.aiError ? (
                  <MobileState kind="degraded" title="AI coach is using smart fallbacks" message="Rule-based progression guidance is still available." />
                ) : aiRecommendations.length ? (
                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {aiRecommendations.map((recommendation, index) => {
                      const RecommendationIcon = recommendationIcons[recommendation.progressionType] || Brain;
                      const confidence = recommendation.confidenceLevel == null
                        ? null
                        : Math.round(recommendation.confidenceLevel <= 1
                          ? recommendation.confidenceLevel * 100
                          : recommendation.confidenceLevel);
                      const priorityStyles = recommendation.priority === 'high'
                        ? { color: '#f87171', borderColor: 'rgba(239,68,68,0.5)', bgcolor: 'rgba(239,68,68,0.16)' }
                        : recommendation.priority === 'medium'
                          ? { color: '#facc15', borderColor: 'rgba(234,179,8,0.5)', bgcolor: 'rgba(234,179,8,0.14)' }
                          : { color: '#60a5fa', borderColor: 'rgba(59,130,246,0.5)', bgcolor: 'rgba(59,130,246,0.14)' };

                      return (
                        <Box key={recommendation.exerciseId || index} sx={{ display: 'grid', gridTemplateColumns: '30px minmax(0, 1fr)', columnGap: 1.5, p: 2, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.025)' }}>
                          <RecommendationIcon size={20} color="var(--primary-a0)" aria-hidden="true" />
                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography sx={{ flex: 1, minWidth: 0, fontSize: '1rem', fontWeight: 700 }}>{recommendation.title}</Typography>
                              <Chip label={recommendation.priority} size="small" variant="outlined" sx={{ height: 24, minWidth: 68, fontWeight: 700, ...priorityStyles }} />
                            </Box>
                            <Typography sx={{ color: 'text.muted', fontSize: '0.9rem', lineHeight: 1.45 }}>{recommendation.description}</Typography>
                            {confidence == null ? null : (
                              <Typography sx={{ mt: 1.5, color: 'text.secondary', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.78rem', letterSpacing: '0.04em' }}>
                                {confidence}% confidence
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : isAiUnlocked ? (
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.86rem' }}>AI recommendations are calibrating from your recent workout history.</Typography>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                    <AIUnlockProgress completedWorkouts={completedWorkoutsCount} totalWorkouts={5} />
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.86rem' }}>
                      Complete {workoutsUntilAiUnlock} more workout{workoutsUntilAiUnlock === 1 ? '' : 's'} to unlock AI recommendations
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </MobileScreen>
  );
}

MobileHome.propTypes = {
  data: PropTypes.shape({
    displayName: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string,
    greeting: PropTypes.string.isRequired,
    weeklyStats: PropTypes.object.isRequired,
    achievements: PropTypes.array,
    aiRecommendations: PropTypes.array.isRequired,
    completedWorkoutsCount: PropTypes.number.isRequired,
    workoutsUntilAiUnlock: PropTypes.number.isRequired,
    isAiUnlocked: PropTypes.bool.isRequired,
  }).isRequired,
  state: PropTypes.shape({ loading: PropTypes.bool, error: PropTypes.any, aiLoading: PropTypes.bool, aiError: PropTypes.string }).isRequired,
  actions: PropTypes.shape({ onOpenProfile: PropTypes.func.isRequired, onRetry: PropTypes.func.isRequired, onQuickWorkout: PropTypes.func.isRequired, onLogActivity: PropTypes.func.isRequired, onSetGoal: PropTypes.func.isRequired }).isRequired,
};

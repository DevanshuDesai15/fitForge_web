import { useReducer, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Alert, Button, Card, Input, ProgressBar, SelectableRow, Switch, colors, fontSizes, fontWeights, spacing } from '@/design-system';
import { AuthHeadline, AuthShell } from '@/features/auth/components/AuthShell';
import { useAuthBootstrap } from '@/features/auth/providers/AuthBootstrapProvider';
import { initialOnboardingState, onboardingReducer, type ExperienceLevel, type TrainingDay, type UnitPreference } from '../model/onboarding';
import { saveOnboarding } from '../services/save-onboarding';

const DAYS: { value: TrainingDay; label: string }[] = [{ value: 'mon', label: 'Mon' }, { value: 'tue', label: 'Tue' }, { value: 'wed', label: 'Wed' }, { value: 'thu', label: 'Thu' }, { value: 'fri', label: 'Fri' }, { value: 'sat', label: 'Sat' }, { value: 'sun', label: 'Sun' }];
const EXPERIENCE: { value: ExperienceLevel; title: string; sub: string }[] = [
  { value: 'new', title: 'New to structured training', sub: 'Start with the fundamentals and build confidence.' },
  { value: 'returning', title: 'Returning or consistent', sub: 'You know the main movements and train regularly.' },
  { value: 'advanced', title: 'Advanced', sub: 'You manage volume, intensity, and progression closely.' },
];
const PROGRAMS = [
  { value: 'strength-foundations', title: 'Strength Foundations', sub: 'A balanced starting point for strength and technique.' },
  { value: 'full-body', title: 'Full Body', sub: 'Train the major movement patterns each session.' },
  { value: 'push-pull-legs', title: 'Push / Pull / Legs', sub: 'A higher-frequency split for experienced lifters.' },
];

export function SetupWizard() {
  const [state, dispatch] = useReducer(onboardingReducer, undefined, initialOnboardingState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, profile, supabase, refreshProfile } = useAuthBootstrap();

  const finish = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await saveOnboarding(supabase, userId, state, profile?.preferences ?? {});
      refreshProfile();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const advance = () => state.step < 4 ? dispatch({ type: 'next' }) : void finish();
  const footer = <View style={styles.footer}><Button fullWidth size="lg" loading={saving} onPress={advance}>{state.step < 4 ? 'Continue' : 'Enter the forge'}</Button><Button fullWidth variant="ghost" disabled={saving} onPress={advance}>Skip for now</Button></View>;
  return <AuthShell onBack={state.step > 0 ? () => dispatch({ type: 'back' }) : undefined} step={`STEP ${state.step + 1} OF 5`} footer={footer}>
    {error ? <Alert tone="error">{error}</Alert> : null}
    <ProgressBar value={state.step + 1} max={5} />
    {state.step === 0 ? <UnitsStep state={state} dispatch={dispatch} /> : null}
    {state.step === 1 ? <ExperienceStep value={state.experience} dispatch={dispatch} /> : null}
    {state.step === 2 ? <ScheduleStep target={state.weeklyTarget} days={state.trainingDays} dispatch={dispatch} /> : null}
    {state.step === 3 ? <ProgramStep value={state.starterProgram} dispatch={dispatch} /> : null}
    {state.step === 4 ? <AlertsStep checked={state.restAlerts} dispatch={dispatch} /> : null}
  </AuthShell>;
}

type Dispatch = React.Dispatch<Parameters<typeof onboardingReducer>[1]>;
function UnitsStep({ state, dispatch }: { state: ReturnType<typeof initialOnboardingState>; dispatch: Dispatch }) {
  const setUnits = (units: UnitPreference) => dispatch({ type: 'set-units', units });
  return <Step title="Make FitForge yours" subtitle="Choose how measurements should appear. You can change this later."><View style={styles.stack}><SelectableRow title="Imperial" sub="Pounds and inches" selected={state.units === 'imperial'} onPress={() => setUnits('imperial')} /><SelectableRow title="Metric" sub="Kilograms and centimeters" selected={state.units === 'metric'} onPress={() => setUnits('metric')} /><Input label={`Bodyweight (${state.units === 'metric' ? 'kg' : 'lb'}) — optional`} numeric value={state.bodyweight} onChangeText={(bodyweight) => dispatch({ type: 'set-bodyweight', bodyweight })} /><Input label={`Height (${state.units === 'metric' ? 'cm' : 'in'}) — optional`} numeric value={state.height} onChangeText={(height) => dispatch({ type: 'set-height', height })} /></View></Step>;
}
function ExperienceStep({ value, dispatch }: { value: ExperienceLevel; dispatch: Dispatch }) { return <Step title="What describes you?" subtitle="This helps us tune the starting experience."><View style={styles.stack}>{EXPERIENCE.map((option) => <SelectableRow key={option.value} title={option.title} sub={option.sub} selected={value === option.value} onPress={() => dispatch({ type: 'set-experience', experience: option.value })} />)}</View></Step>; }
function ScheduleStep({ target, days, dispatch }: { target: number; days: TrainingDay[]; dispatch: Dispatch }) { return <Step title="Set your weekly rhythm" subtitle="Pick a target and any days you already prefer."><Text style={styles.label}>Workouts per week</Text><View style={styles.wrap}>{[3, 4, 5, 6].map((count) => <Button key={count} variant={target === count ? 'primary' : 'secondary'} onPress={() => dispatch({ type: 'set-weekly-target', weeklyTarget: count })}>{String(count)}</Button>)}</View><Text style={styles.label}>Preferred training days — optional</Text><View style={styles.wrap}>{DAYS.map((day) => <Button key={day.value} variant={days.includes(day.value) ? 'primary' : 'secondary'} onPress={() => dispatch({ type: 'toggle-day', day: day.value })}>{day.label}</Button>)}</View></Step>; }
function ProgramStep({ value, dispatch }: { value: string; dispatch: Dispatch }) { return <Step title="Choose a starting direction" subtitle="This saves your preference. You’ll be able to build and edit the full program next."><View style={styles.stack}>{PROGRAMS.map((program) => <SelectableRow key={program.value} title={program.title} sub={program.sub} selected={value === program.value} onPress={() => dispatch({ type: 'set-starter-program', starterProgram: program.value })} />)}</View></Step>; }
function AlertsStep({ checked, dispatch }: { checked: boolean; dispatch: Dispatch }) { return <Step title="Stay on pace" subtitle="Choose whether rest-timer alerts should be enabled when workout notifications arrive in a later phase."><Card tone="quiet"><Switch checked={checked} onChange={(restAlerts) => dispatch({ type: 'set-rest-alerts', restAlerts })} label="Rest timer alerts" description="We are saving your preference now; this screen does not request phone notification permission." /></Card></Step>; }
function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <View><AuthHeadline title={title} subtitle={subtitle} />{children}</View>; }

const styles = StyleSheet.create({ stack: { gap: spacing[3] }, footer: { gap: spacing[1] }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[6] }, label: { color: colors.text.primary, fontFamily: fontWeights.semibold, fontSize: fontSizes.base, marginBottom: spacing[3] } });

import { Activity, Anchor, Bike, Footprints, Mountain, PersonStanding, TrendingUp, Waves, Zap } from 'lucide-react';

export const MUSCLE_GROUPS = [
    'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core',
    'Glutes', 'Hamstrings', 'Quadriceps', 'Calves'
];

export const CARDIO_ACTIVITIES = [
    { name: 'Running', Icon: Footprints }, { name: 'Jogging', Icon: Footprints },
    { name: 'Walking', Icon: PersonStanding }, { name: 'Hiking', Icon: Mountain },
    { name: 'Cycling', Icon: Bike }, { name: 'Swimming', Icon: Waves },
    { name: 'Jump Rope', Icon: Zap }, { name: 'Rowing', Icon: Anchor },
    { name: 'Elliptical', Icon: Activity }, { name: 'Stair Climber', Icon: TrendingUp },
];

export function buildCardioExercise(activityName) {
    return { name: activityName, exercise_type: 'cardio', cardio: { duration_minutes: null, distance_km: null, completed: false } };
}

const KM_TO_MI = 0.621371;
export function toDisplayDistance(km, weightUnit) {
    if (km === null || km === undefined) return '';
    return weightUnit === 'lbs' ? parseFloat((km * KM_TO_MI).toFixed(2)) : km;
}
export function toStoredKm(displayValue, weightUnit) {
    if (displayValue === '' || displayValue === null || displayValue === undefined) return null;
    const num = parseFloat(displayValue);
    if (isNaN(num)) return null;
    return weightUnit === 'lbs' ? num / KM_TO_MI : num;
}
export function formatPreviousSet(set, weightUnit = 'kg') {
    return `${set.reps ?? '—'} reps @ ${set.weight || '0'} ${weightUnit}`;
}
export { KM_TO_MI };

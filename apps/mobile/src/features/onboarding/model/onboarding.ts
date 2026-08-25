export type UnitPreference = 'metric' | 'imperial';
export type ExperienceLevel = 'new' | 'returning' | 'advanced';
export type TrainingDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type OnboardingState = {
  step: number;
  units: UnitPreference;
  bodyweight: string;
  height: string;
  experience: ExperienceLevel;
  weeklyTarget: number;
  trainingDays: TrainingDay[];
  starterProgram: string;
  restAlerts: boolean;
};

export type OnboardingAction =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'set-units'; units: UnitPreference }
  | { type: 'set-bodyweight'; bodyweight: string }
  | { type: 'set-height'; height: string }
  | { type: 'set-experience'; experience: ExperienceLevel }
  | { type: 'set-weekly-target'; weeklyTarget: number }
  | { type: 'toggle-day'; day: TrainingDay }
  | { type: 'set-starter-program'; starterProgram: string }
  | { type: 'set-rest-alerts'; restAlerts: boolean };

export const initialOnboardingState = (): OnboardingState => ({
  step: 0,
  units: 'imperial',
  bodyweight: '',
  height: '',
  experience: 'new',
  weeklyTarget: 3,
  trainingDays: [],
  starterProgram: 'strength-foundations',
  restAlerts: true,
});

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'next': return { ...state, step: Math.min(4, state.step + 1) };
    case 'back': return { ...state, step: Math.max(0, state.step - 1) };
    case 'set-units': return { ...state, units: action.units };
    case 'set-bodyweight': return { ...state, bodyweight: action.bodyweight };
    case 'set-height': return { ...state, height: action.height };
    case 'set-experience': return { ...state, experience: action.experience };
    case 'set-weekly-target': return { ...state, weeklyTarget: action.weeklyTarget };
    case 'toggle-day': return { ...state, trainingDays: state.trainingDays.includes(action.day) ? state.trainingDays.filter((day) => day !== action.day) : [...state.trainingDays, action.day] };
    case 'set-starter-program': return { ...state, starterProgram: action.starterProgram };
    case 'set-rest-alerts': return { ...state, restAlerts: action.restAlerts };
  }
}

const toArray = (value) => (Array.isArray(value) ? value : []);
const dateOf = (w) => new Date(w?.timestamp ?? w?.completedAt ?? w?.createdAt ?? 0).getTime() || 0;

// The day a program should serve next: the one after whatever the user last trained from a program,
// in the program's own order, wrapping at the end. With no program history it is the first day of the
// first program. Programs are an ordered list of template ids (`template_ids`), each template a day.
//
// A past session is tied back to a program three ways, strongest first, because sessions have been
// saved with different links over time:
//   1. templateId is the program id, and dayName names one of its days
//   2. templateId is the template id of one of its days (preferring the program named templateName)
//   3. no usable link, but dayName matches a day name (older "Custom Workout - Push Day" sessions)
export function deriveNextProgramWorkout({ programs = [], templates = [], workouts = [] }) {
  const templateById = new Map(toArray(templates).map((t) => [t.id, t]));
  const candidates = toArray(programs)
    .map((program) => ({
      program,
      days: toArray(program.template_ids ?? program.templateIds).map((id) => templateById.get(id)).filter(Boolean),
    }))
    .filter((candidate) => candidate.days.length);
  if (!candidates.length) return null;

  const preferNamed = (list, name) => list.find((c) => c.program.name === name) || list[0];

  const locate = (workout) => {
    const templateId = workout.templateId ?? workout.template_id;
    const dayName = workout.dayName ?? workout.day_name;
    const programName = workout.templateName ?? workout.template_name;

    for (const c of candidates.filter((x) => x.program.id === templateId)) {
      const index = c.days.findIndex((d) => d.name === dayName);
      if (index >= 0) return { c, index };
    }
    const byDayTemplate = candidates.filter((x) => x.days.some((d) => d.id === templateId));
    if (byDayTemplate.length) {
      const c = preferNamed(byDayTemplate, programName);
      return { c, index: c.days.findIndex((d) => d.id === templateId) };
    }
    const byName = dayName ? candidates.filter((x) => x.days.some((d) => d.name === dayName)) : [];
    if (byName.length) {
      const c = preferNamed(byName, programName);
      return { c, index: c.days.findIndex((d) => d.name === dayName) };
    }
    return null;
  };

  let anchor = null;
  for (const workout of [...toArray(workouts)].sort((a, b) => dateOf(b) - dateOf(a))) {
    anchor = locate(workout);
    if (anchor) break;
  }
  const { c, index } = anchor || { c: candidates[0], index: -1 };
  const day = c.days[(index + 1) % c.days.length];

  return {
    id: day.id,
    name: day.name,
    focus: day.description || '',
    exercises: toArray(day.exercises),
    programId: c.program.id,
    programName: c.program.name,
    programTemplateIds: c.days.map((d) => d.id),
  };
}

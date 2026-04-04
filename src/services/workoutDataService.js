const toArray = (value) => (Array.isArray(value) ? value : []);
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const setIfPresent = (target, source, sourceKey, targetKey = sourceKey, transform = (value) => value) => {
  if (hasOwn(source, sourceKey)) {
    target[targetKey] = transform(source[sourceKey]);
  }
};

export function mapTemplateToDb(template = {}, userId, options = {}) {
  return {
    user_id: userId,
    name: template.name ?? '',
    description: template.description ?? '',
    category: template.category ?? null,
    difficulty: template.difficulty ?? null,
    exercises: toArray(template.exercises),
    estimated_duration_minutes:
      template.estimatedDurationMinutes ?? template.estimated_duration_minutes ?? null,
    is_custom: template.isCustom ?? template.is_custom ?? false,
    ...(options.createdAt !== undefined ? { created_at: options.createdAt } : {}),
    ...(options.updatedAt !== undefined ? { updated_at: options.updatedAt } : {}),
  };
}

export function mapProgramToDb(program = {}, userId, options = {}) {
  return {
    user_id: userId,
    name: program.name ?? '',
    description: program.description ?? '',
    category: program.category ?? null,
    difficulty: program.difficulty ?? null,
    frequency: program.frequency ?? null,
    duration: program.duration ?? null,
    template_ids: toArray(program.templateIds ?? program.template_ids),
    ...(options.createdAt !== undefined ? { created_at: options.createdAt } : {}),
    ...(options.updatedAt !== undefined ? { updated_at: options.updatedAt } : {}),
  };
}

export function mapWorkoutToDb(workout = {}, userId, options = {}) {
  return {
    user_id: userId,
    template_id: workout.templateId ?? workout.template_id ?? null,
    template_name: workout.templateName ?? workout.template_name ?? '',
    day_name: workout.dayName ?? workout.day_name ?? '',
    weight_unit: workout.weightUnit ?? workout.weight_unit ?? null,
    exercises: toArray(workout.exercises),
    duration: workout.duration ?? null,
    completed: workout.completed ?? false,
    completed_at: workout.completedAt ?? workout.completed_at ?? null,
    timestamp: workout.timestamp ?? null,
    notes: workout.notes ?? '',
    ...(options.createdAt !== undefined ? { created_at: options.createdAt } : {}),
    ...(options.updatedAt !== undefined ? { updated_at: options.updatedAt } : {}),
  };
}

export function mapTemplateUpdateToDb(template = {}) {
  const patch = {};

  setIfPresent(patch, template, 'name');
  setIfPresent(patch, template, 'description');
  setIfPresent(patch, template, 'category');
  setIfPresent(patch, template, 'difficulty');
  setIfPresent(patch, template, 'exercises', 'exercises', toArray);
  setIfPresent(
    patch,
    template,
    'estimatedDurationMinutes',
    'estimated_duration_minutes'
  );
  setIfPresent(
    patch,
    template,
    'estimated_duration_minutes',
    'estimated_duration_minutes'
  );
  setIfPresent(patch, template, 'isCustom', 'is_custom');
  setIfPresent(patch, template, 'is_custom', 'is_custom');

  return patch;
}

export function mapProgramUpdateToDb(program = {}) {
  const patch = {};

  setIfPresent(patch, program, 'name');
  setIfPresent(patch, program, 'description');
  setIfPresent(patch, program, 'category');
  setIfPresent(patch, program, 'difficulty');
  setIfPresent(patch, program, 'frequency');
  setIfPresent(patch, program, 'duration');
  setIfPresent(patch, program, 'templateIds', 'template_ids', toArray);
  setIfPresent(patch, program, 'template_ids', 'template_ids', toArray);

  return patch;
}

export function mapWorkoutUpdateToDb(workout = {}) {
  const patch = {};

  setIfPresent(patch, workout, 'templateId', 'template_id');
  setIfPresent(patch, workout, 'template_id', 'template_id');
  setIfPresent(patch, workout, 'templateName', 'template_name');
  setIfPresent(patch, workout, 'template_name', 'template_name');
  setIfPresent(patch, workout, 'dayName', 'day_name');
  setIfPresent(patch, workout, 'day_name', 'day_name');
  setIfPresent(patch, workout, 'weightUnit', 'weight_unit');
  setIfPresent(patch, workout, 'weight_unit', 'weight_unit');
  setIfPresent(patch, workout, 'exercises', 'exercises', toArray);
  setIfPresent(patch, workout, 'duration');
  setIfPresent(patch, workout, 'completed');
  setIfPresent(patch, workout, 'completedAt', 'completed_at');
  setIfPresent(patch, workout, 'completed_at', 'completed_at');
  setIfPresent(patch, workout, 'timestamp');
  setIfPresent(patch, workout, 'notes');

  return patch;
}

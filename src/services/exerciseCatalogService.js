export const normalizeExerciseCatalogRow = (row) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description || '',
  steps: row.steps || [],
  primaryMuscle: row.primary_muscle || row.body_part || 'Unknown',
  secondaryMuscles: row.secondary_muscles || [],
  equipmentNeeded: row.equipment_needed || [],
  exerciseTypes: row.exercise_types || [],
  difficulty: row.difficulty || 'Beginner',
  videoUrls: row.video_urls || {},
  proTips: row.pro_tips || [],
  commonMistakes: row.common_mistakes || [],
  variations: row.variations || [],
  safetyConsiderations: row.safety_considerations || [],
  tags: row.tags || [],
});

export const buildExerciseCatalogRange = ({ page, pageSize }) => {
  const from = Math.max(page - 1, 0) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
};

export const getDistinctFilterOptions = (rows) => {
  const primaryMuscles = new Set();
  const equipment = new Set();
  const difficulties = new Set();
  const tags = new Set();

  rows.forEach((row) => {
    if (row.primary_muscle) primaryMuscles.add(row.primary_muscle);
    if (row.difficulty) difficulties.add(row.difficulty);
    (row.equipment_needed || []).forEach((value) => equipment.add(value));
    (row.tags || []).forEach((value) => tags.add(value));
  });

  return {
    primaryMuscles: [...primaryMuscles].sort(),
    equipment: [...equipment].sort(),
    difficulties: [...difficulties].sort(),
    tags: [...tags].sort(),
  };
};

export const fetchExerciseCatalogPage = async (supabase, filters) => {
  const { from, to } = buildExerciseCatalogRange(filters);
  let query = supabase
    .from('exercises')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to);

  if (filters.primaryMuscle) query = query.eq('primary_muscle', filters.primaryMuscle);
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
  if (filters.searchTerm) query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);

  if (filters.equipment) query = query.contains('equipment_needed', [filters.equipment]);
  if (filters.tag) query = query.contains('tags', [filters.tag]);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    items: (data || []).map(normalizeExerciseCatalogRow),
    totalCount: count || 0,
  };
};

export const normalizeExerciseCatalogRow = (row) => {
  const name = row.name || row.title || 'Unnamed Exercise';
  const primaryMuscle = row.primary_muscle || row.target_muscle || row.body_part || 'Unknown';
  const secondaryMuscles = row.secondary_muscles
    || (row.muscles || []).filter((muscle) => muscle !== primaryMuscle);
  const equipmentNeeded = row.equipment_needed
    || (row.equipment ? [row.equipment] : []);
  const videoUrls = row.video_urls || {};

  return {
    id: row.id,
    slug: row.slug,
    name,
    description: row.description || '',
    steps: row.steps || [],
    primaryMuscle,
    secondaryMuscles,
    equipmentNeeded,
    exerciseTypes: row.exercise_types || [],
    difficulty: row.difficulty || 'Beginner',
    videoUrls,
    proTips: row.pro_tips || [],
    commonMistakes: row.common_mistakes || [],
    variations: row.variations || [],
    safetyConsiderations: row.safety_considerations || [],
    tags: row.tags || [],
    title: name,
    bodyPart: primaryMuscle,
    target: primaryMuscle,
    equipment: equipmentNeeded[0] || 'Bodyweight',
    muscles: [primaryMuscle, ...secondaryMuscles].filter(Boolean),
    primaryMuscles: [primaryMuscle].filter(Boolean),
    video_urls: videoUrls,
  };
};

const sanitizeSearchTerm = (value) => String(value || '').replace(/[,%()]/g, ' ').trim();

export const fetchExerciseCatalogList = async (
  supabase,
  { limit = 50, offset = 0, searchTerm = '' } = {}
) => {
  const boundedLimit = Math.max(1, Math.min(Number(limit) || 50, 1000));
  const boundedOffset = Math.max(0, Number(offset) || 0);
  let query = supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true })
    .range(boundedOffset, boundedOffset + boundedLimit - 1);

  const normalizedSearch = sanitizeSearchTerm(searchTerm);
  if (normalizedSearch) {
    query = query.or(
      `name.ilike.%${normalizedSearch}%,description.ilike.%${normalizedSearch}%,primary_muscle.ilike.%${normalizedSearch}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeExerciseCatalogRow);
};

export const fetchAllExerciseCatalog = async (supabase, { pageSize = 1000 } = {}) => {
  const exercises = [];
  let offset = 0;

  while (true) {
    const page = await fetchExerciseCatalogList(supabase, { limit: pageSize, offset });
    exercises.push(...page);
    if (page.length < pageSize) return exercises;
    offset += pageSize;
  }
};

export const fetchExerciseCatalogById = async (supabase, exerciseId) => {
  if (!supabase || !exerciseId) return null;
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeExerciseCatalogRow(data) : null;
};

export const formatExerciseCatalogRagContext = (exercise) => {
  if (!exercise) return null;
  return JSON.stringify({
    name: exercise.name,
    description: exercise.description,
    difficulty: exercise.difficulty,
    target: exercise.target,
    equipment: exercise.equipment,
    steps: exercise.steps || [],
    muscle_groups: exercise.muscles || [],
  });
};

export const fetchExerciseMuscleMapByNames = async (supabase, names = []) => {
  const uniqueNames = [...new Set(names.filter(Boolean))];
  if (uniqueNames.length === 0) return new Map();

  const { data, error } = await supabase
    .from('exercises')
    .select('name, primary_muscle, body_part')
    .in('name', uniqueNames);
  if (error) throw error;

  return new Map((data || []).map((row) => [row.name, {
    body_part: row.body_part || null,
    target_muscle: row.primary_muscle || null,
  }]));
};

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

export const fetchExerciseCatalogFilters = async (supabase) => {
  const { data, error } = await supabase
    .from('exercises')
    .select('primary_muscle, difficulty, equipment_needed, tags, body_part');
    
  if (error) throw error;
  
  return getDistinctFilterOptions(data);
};

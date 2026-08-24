export const getWorkoutTabFromSearchParams = (searchParams) => (
    searchParams.get('tab') === 'library' ? 1 : 0
);

let sequence = 0;
export const randomUUID = () => `00000000-0000-4000-8000-${String(sequence += 1).padStart(12, '0')}`;

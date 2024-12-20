export const PRIORITIES = ['Low', 'Moderate', 'High', 'Critical'];

export function cyclePriority(currentPriority) {
    const currentIndex = PRIORITIES.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % PRIORITIES.length;
    return PRIORITIES[nextIndex];
}
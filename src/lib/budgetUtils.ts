export const sortEventsByBudget = <T extends { event_requirements?: { min_budget_lakhs?: number | null } | null }>(
  events: T[],
  order: 'Highest Budget' | 'Lowest Budget'
): T[] => {
  return [...events].sort((a, b) => {
    const budgetA = a.event_requirements?.min_budget_lakhs || 0;
    const budgetB = b.event_requirements?.min_budget_lakhs || 0;
    
    if (order === 'Highest Budget') {
      return budgetB - budgetA;
    }
    return budgetA - budgetB;
  });
};

export const formatBudgetRange = (min: number | null | undefined, max: number | null | undefined): string => {
  if (min == null && max == null) return 'Not specified';
  
  if (min === 0 && max != null) {
    return `Under ₹${max} Lakh${max === 1 ? '' : 's'}`;
  }
  
  if (min != null && max == null) {
    return `₹${min} Lakhs+`;
  }
  
  if (min === max) {
    return `₹${min} Lakh${min === 1 ? '' : 's'}`;
  }
  
  return `₹${min}L - ₹${max}L`;
};

export const formatEstimatedBudget = (budget: number | null | undefined): string => {
  if (budget == null) return 'Not specified';
  return `₹${budget} Lakh${budget === 1 ? '' : 's'}`;
};

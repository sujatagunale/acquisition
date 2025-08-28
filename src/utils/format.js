export const formatValidationError = error => {
  if (!error || !error.issues) return 'Validation failed';

  if (Array.isArray(error.issues)) {
    return error.issues.map(issue => issue.message).join(', ');
  }

  return JSON.stringify(error);
};

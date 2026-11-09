/** What went wrong, for a warning: an error's message, or whatever else was thrown. */
export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

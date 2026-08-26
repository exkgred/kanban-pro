export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) {
    return fallback;
  }

  const maybe = error as {
    message?: string;
    response?: {
      data?: {
        error?: { message?: string };
        message?: string;
      };
    };
  };

  return (
    maybe.response?.data?.error?.message ||
    maybe.response?.data?.message ||
    maybe.message ||
    fallback
  );
}

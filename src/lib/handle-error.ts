import { z } from "zod";

// Narrow type guard for Next.js redirect errors without importing internal modules.
// In Next 13/14, redirect errors typically carry a `digest` starting with "NEXT_REDIRECT".
function isNextRedirectError(err: unknown): err is { digest: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    // @ts-expect-error: runtime check for Next-internal shape
    typeof err.digest === "string" &&
    // @ts-expect-error: runtime check for Next-internal shape
    err.digest.startsWith("NEXT_REDIRECT")
  );
}

export function getErrorMessage(err: unknown) {
  const unknownError = "Something went wrong, please try again later.";

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });
    return errors.join("\n");
  }

  if (err instanceof Error) {
    return err.message;
  }

  if (isNextRedirectError(err)) {
    throw err;
  }

  return unknownError;
}

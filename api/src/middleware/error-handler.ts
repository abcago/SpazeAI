import type { ErrorHandler } from "hono";
import { ZodError } from "zod";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[Error] ${err.message}`, err.stack);

  if (err instanceof ZodError) {
    return c.json(
      {
        error: "Validation error",
        details: err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
      400
    );
  }

  const status = "status" in err ? (err.status as number) : 500;
  return c.json(
    {
      error: status === 500 ? "Internal server error" : err.message,
    },
    status as any
  );
};

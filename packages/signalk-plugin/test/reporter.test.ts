import { expect, test } from "vitest";
import { createReportLogger } from "../src";
import { createDB } from "../src/storage";

test("logReport", async () => {
  const logger = createReportLogger(createDB(":memory:"));
  const from = new Date("2025-08-06T22:00:00.000Z");
  const to = new Date("2025-08-06T23:00:00.000Z");

  expect(logger.lastReport).toBeUndefined();
  logger.logReport!({ from, to });
  expect(logger.lastReport).toEqual(to);
});

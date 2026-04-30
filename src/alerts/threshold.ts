/**
 * Determines whether a given duration exceeds the configured slow threshold.
 *
 * @param durationMs - Measured response duration in milliseconds.
 * @param thresholdMs - Configured threshold in milliseconds.
 * @returns true if the duration is considered slow.
 */
export function checkThreshold(durationMs: number, thresholdMs: number): boolean {
  if (thresholdMs <= 0) {
    throw new RangeError(`slowThresholdMs must be a positive number, got ${thresholdMs}`);
  }
  return durationMs >= thresholdMs;
}

/**
 * Formats a slow-route alert message for logging.
 */
export function formatAlertMessage(
  method: string,
  route: string,
  durationMs: number,
  thresholdMs: number
): string {
  return (
    `[routewatch] SLOW ROUTE DETECTED: ${method.toUpperCase()} ${route} ` +
    `took ${durationMs.toFixed(2)}ms (threshold: ${thresholdMs}ms)`
  );
}

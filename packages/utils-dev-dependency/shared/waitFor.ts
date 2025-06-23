export async function waitFor(
  callback: () => void | Promise<void>,
  { timeout = 2000, interval = 10 } = {},
): Promise<void> {
  const start = Date.now();
  let lastError: unknown;
  while (Date.now() - start < timeout) {
    try {
      await callback();
      return;
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, interval));
    }
  }
  throw lastError || new Error("Timed out in waitFor");
}

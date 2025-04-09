import { FullConfig } from "@playwright/test";

const POLLING_INTERVAL = 3000; // Check every 3 seconds
const TIMEOUT = 90000; // Max wait time: 90 seconds total

async function waitForEndpoint(
  url: string,
  serviceName: string,
  timeout: number,
): Promise<void> {
  const startTime = Date.now();
  console.log(`Waiting for ${serviceName} at ${url}...`);

  while (Date.now() - startTime < timeout) {
    // Create an AbortController for this specific attempt
    const controller = new AbortController();
    // Set a timeout to abort the fetch if it takes too long
    const timeoutId = setTimeout(() => {
      console.log(`Workspace timed out for ${serviceName} at ${url}`);
      controller.abort();
    }, POLLING_INTERVAL - 500); // Timeout slightly less than interval

    try {
      // Pass the AbortSignal to fetch
      const response = await fetch(url, { signal: controller.signal });

      // IMPORTANT: Clear the timeout timer if fetch completes (success or failure)
      clearTimeout(timeoutId);

      if (response.ok) {
        // status code 200-299
        console.log(
          `${serviceName} is ready at ${url} (Status: ${response.status})`,
        );
        return; // Success!
      }
      console.log(
        `${serviceName} not ready yet at ${url} (Status: ${response.status}). Retrying...`,
      );
    } catch (error: any) {
      // Clear the timeout timer in case of error too
      clearTimeout(timeoutId);

      // Check if the error was due to the abort signal (timeout)
      if (error.name === "AbortError") {
        // Log message already printed by the setTimeout callback
        // console.log(`${serviceName} fetch timed out at ${url}. Retrying...`);
      } else {
        console.log(
          `${serviceName} not reachable yet at ${url} (Error: ${error.message || error}). Retrying...`,
        );
      }
    }
    // Wait before the next attempt in the while loop
    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
  }

  // If the while loop finishes, the overall timeout was exceeded
  throw new Error(
    `${serviceName} at ${url} did not become ready within ${timeout / 1000} seconds.`,
  );
}

// --- Rest of your globalSetup function remains the same ---
async function globalSetup(config: FullConfig): Promise<void> {
  console.log("--- Global Setup Starting ---");
  const appHealthUrl = "http://localhost:8080/health";
  const elasticsearchUrl = "http://localhost:9200";

  try {
    await Promise.all([
      waitForEndpoint(appHealthUrl, "Application Server", TIMEOUT),
      waitForEndpoint(elasticsearchUrl, "Elasticsearch", TIMEOUT),
    ]);
    console.log("--- Both services are ready! Proceeding with tests. ---");
  } catch (error) {
    console.error("--- Global Setup Failed ---");
    console.error(error);
    throw error;
  }
}

export default globalSetup;

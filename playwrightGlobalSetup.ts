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
      const response = await fetch(url, { signal: controller.signal });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(
          `${serviceName} is ready at ${url} (Status: ${response.status})`,
        );
        return;
      }
      console.log(
        `${serviceName} not ready yet at ${url} (Status: ${response.status}). Retrying...`,
      );
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name !== "AbortError") {
        console.log(
          `${serviceName} not reachable yet at ${url} (Error: ${error.message || error}). Retrying...`,
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
  }

  throw new Error(
    `${serviceName} at ${url} did not become ready within ${timeout / 1000} seconds.`,
  );
}

async function globalSetup(config: FullConfig): Promise<void> {
  console.log("--- Global Setup Starting ---");
  const appHealthUrl = "http://localhost:8080/ready";
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

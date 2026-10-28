import type { WeatherErrorCode } from "@/lib/types";

export class WeatherProviderError extends Error {
  code: WeatherErrorCode;
  status: number;
  detail?: string;

  constructor(code: WeatherErrorCode, message?: string, status = 502, detail?: string) {
    super(message ?? code);
    this.name = "WeatherProviderError";
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

export async function fetchJson<T>(
  url: string,
  options: { revalidate?: number; headers?: Record<string, string>; timeoutMs?: number } = {},
): Promise<T> {
  const { revalidate, headers, timeoutMs = 12_000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...headers,
      },
      signal: controller.signal,
      ...(revalidate === undefined
        ? { cache: "no-store" as const }
        : { next: { revalidate } }),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new WeatherProviderError("key_invalid", "Provider rejected the key", 502);
      }
      if (response.status === 429) {
        throw new WeatherProviderError("rate_limit", "Provider rate limit", 502);
      }
      throw new WeatherProviderError(
        "provider_error",
        `Provider responded with ${response.status}`,
        response.status >= 500 ? 502 : 400,
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof WeatherProviderError) throw error;
    if (isAbortError(error)) {
      throw new WeatherProviderError("timeout", "Provider timed out", 504);
    }
    throw new WeatherProviderError(
      "provider_error",
      error instanceof Error ? error.message : "Provider request failed",
      502,
    );
  } finally {
    clearTimeout(timer);
  }
}

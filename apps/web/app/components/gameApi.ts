const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function gameApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown API error" }));
    throw new Error(error.error || "API request failed");
  }

  return response.json() as Promise<T>;
}

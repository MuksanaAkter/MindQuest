export async function quizApi<T>(url: string, data?: object, method = "POST"): Promise<T> {
  const response = await fetch(url, { method: data ? method : "GET", headers: data ? { "Content-Type": "application/json" } : undefined, body: data ? JSON.stringify(data) : undefined, cache: "no-store", signal: AbortSignal.timeout(15000) });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to complete this request.");
  return result as T;
}

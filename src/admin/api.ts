type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export async function adminRequest<T>(url: string, init?: RequestInit, fetcher: Fetcher = fetch): Promise<T> {
  const response = await fetcher(url, {
    credentials: "same-origin",
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  let body: { error?: string };
  try {
    if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Non-JSON response");
    body = await response.json() as { error?: string };
  } catch {
    throw new Error("服务器响应异常，请刷新后重试");
  }
  if (!response.ok) throw new Error(body.error || "请求没有完成，请稍后重试");
  return body as T;
}

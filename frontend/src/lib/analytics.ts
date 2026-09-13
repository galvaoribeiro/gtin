type AnalyticsPayload = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: string, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;

  const data = { event, ...payload, timestamp: new Date().toISOString() };

  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", data);
  }

  window.dataLayer?.push(data);
}

// TODO: disparar no backend quando necessário — api_key_created, first_api_request

import { AppConfig } from "./config.js";

export class WealthboxClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(config: AppConfig) {
    this.baseUrl = config.WEALTHBOX_API_BASE_URL.replace(/\/$/, "");
    this.token = config.WEALTHBOX_TOKEN;
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ACCESS_TOKEN: this.token,
      ...extra,
    };
  }

  async request<T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      });
    }

    const res = await fetch(url.toString(), {
      method,
      headers: this.buildHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Wealthbox API error ${res.status}: ${text}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  }

  // Minimal helpers for common endpoints from docs
  getMe() {
    // Me: Retrieve login profile information
    return this.request<{ user: unknown }>("GET", "/v1/me");
  }

  listUsers() {
    // Users: Retrieve all users
    return this.request<{ users: unknown[] }>("GET", "/v1/users");
  }

  listTeams() {
    // Teams: List all teams
    return this.request<{ teams: unknown[] }>("GET", "/v1/teams");
  }
}


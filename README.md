# wealthbox-mcp

TypeScript MCP server for the Wealthbox API.

Setup

- Ensure Node.js 18+.
- Provide a Wealthbox API access token via one of:
  - Env var `WEALTHBOX_TOKEN`
  - File `wealthbox_key.txt` in project root (first line used)
- Optional: override base URL with `WEALTHBOX_API_BASE_URL` (default `https://api.crmworkspace.com`).

Install & Build

```bash
npm install
npm run build
```

Run (stdio)

```bash
WEALTHBOX_TOKEN=your_token_here node dist/index.js
```

Tools

- `wealthbox.getMe` – Retrieve login profile information
- `wealthbox.listUsers` – List all users
- `wealthbox.listTeams` – List all teams
- `wealthbox.request` – Generic method/path/body/query caller for any `/v1` endpoint

References

- Wealthbox API docs: https://dev.wealthbox.com/
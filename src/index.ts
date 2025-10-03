import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListResourcesRequestSchema, CallToolRequestSchema, ErrorSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.js";
import { WealthboxClient } from "./wealthboxClient.js";

async function main() {
  const config = loadConfig();
  const client = new WealthboxClient(config);

  const server = new Server({
    name: "wealthbox-mcp",
    version: "0.1.0",
    description: "MCP server for the Wealthbox API",
  }, {
    capabilities: {
      tools: {},
    },
  });

  server.tool("wealthbox.getMe", {
    description: "Retrieve login profile information for the authenticated user",
    inputSchema: {
      type: "object",
      properties: {},
    },
  }, async () => {
    const data = await client.getMe();
    return { content: [{ type: "json", json: data }] };
  });

  server.tool("wealthbox.listUsers", {
    description: "List all users accessible to the authenticated account",
    inputSchema: {
      type: "object",
      properties: {},
    },
  }, async () => {
    const data = await client.listUsers();
    return { content: [{ type: "json", json: data }] };
  });

  server.tool("wealthbox.listTeams", {
    description: "List all teams in the authenticated account",
    inputSchema: {
      type: "object",
      properties: {},
    },
  }, async () => {
    const data = await client.listTeams();
    return { content: [{ type: "json", json: data }] };
  });

  server.tool("wealthbox.request", {
    description: "Generic Wealthbox API request tool supporting method, path, body, and query",
    inputSchema: {
      type: "object",
      properties: {
        method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
        path: { type: "string", description: "API path beginning with /v1" },
        body: { type: ["object", "null"], nullable: true },
        query: { type: "object", additionalProperties: true },
      },
      required: ["method", "path"],
    },
  }, async (args) => {
    const { method, path, body, query } = args as { method: string; path: string; body?: unknown; query?: Record<string, unknown> };
    const data = await client.request(method, path, body, query as any);
    return { content: [{ type: "json", json: data }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error starting wealthbox-mcp:", err);
  process.exit(1);
});



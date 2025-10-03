#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.js";
import { WealthboxClient } from "./wealthboxClient.js";

async function main() {
  const config = loadConfig();
  const client = new WealthboxClient(config);

  const server = new Server(
    {
      name: "wealthbox-mcp",
      version: "0.1.0",
      description: "MCP server for the Wealthbox API",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const tools = [
    {
      name: "wealthbox.health",
      description: "Health check that hits /v1/me to verify token and connectivity",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "wealthbox.getMe",
      description: "Retrieve login profile information for the authenticated user",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "wealthbox.listUsers",
      description: "List all users accessible to the authenticated account",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "wealthbox.listTeams",
      description: "List all teams in the authenticated account",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "wealthbox.request",
      description:
        "Generic Wealthbox API request tool supporting method, path, body, and query",
      inputSchema: {
        type: "object",
        properties: {
          method: {
            type: "string",
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          },
          path: { type: "string", description: "API path beginning with /v1" },
          body: { type: ["object", "null"], nullable: true },
          query: { type: "object", additionalProperties: true },
        },
        required: ["method", "path"],
      },
    },
  ];

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (req: any) => {
    const { name, arguments: args } = req.params;
    switch (name) {
      case "wealthbox.health": {
        const data = await client.getMe();
        return {
          content: [{ type: "text", text: "ok" }],
          structuredContent: { ok: true, me: data },
        };
      }
      case "wealthbox.getMe": {
        const data = await client.getMe();
        return { content: [{ type: "text", text: "me" }], structuredContent: data };
      }
      case "wealthbox.listUsers": {
        const data = await client.listUsers();
        return { content: [{ type: "text", text: "users" }], structuredContent: data };
      }
      case "wealthbox.listTeams": {
        const data = await client.listTeams();
        return { content: [{ type: "text", text: "teams" }], structuredContent: data };
      }
      case "wealthbox.request": {
        const { method, path, body, query } = (args || {}) as {
          method: string;
          path: string;
          body?: unknown;
          query?: Record<string, string | number | boolean | undefined>;
        };
        if (!method || !path) {
          throw new Error("wealthbox.request requires method and path");
        }
        const data = await client.request(method, path, body, query);
        return { content: [{ type: "text", text: `${method} ${path}` }], structuredContent: data };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error starting wealthbox-mcp:", err);
  process.exit(1);
});



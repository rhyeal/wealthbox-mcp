#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.js";
import { WealthboxClient } from "./wealthboxClient.js";

async function main() {
  const config = loadConfig();
  const client = new WealthboxClient(config);

  const withDefaultPage = (query?: Record<string, unknown>) => {
    const q: Record<string, unknown> = { ...(query || {}) };
    if (q.page === undefined) q.page = 1;
    if (q.per_page === undefined) q.per_page = 5;
    return q;
  };

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
    // Contacts
    { name: "wealthbox.contacts.list", description: "List contacts. Query params: name, email, phone, contact_type, id, active, tags[], type (person|household|organization|trust), page, per_page. Example: {\"query\":{\"name\":\"John\",\"per_page\":10}}", inputSchema: { type: "object", properties: { query: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, contact_type: { type: "string" }, id: { type: "number" }, active: { type: "boolean" }, tags: { type: "array", items: { type: "string" } }, type: { type: "string", enum: ["person","household","organization","trust"] }, page: { type: "number" }, per_page: { type: "number" } }, additionalProperties: true } } } },
    { name: "wealthbox.contacts.get", description: "Get contact by id", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    { name: "wealthbox.contacts.create", description: "Create contact. Example: {\"first_name\":\"Ada\",\"last_name\":\"Lovelace\"}. You can also provide a raw body.", inputSchema: { type: "object", properties: { first_name: { type: "string" }, last_name: { type: "string" }, type: { type: "string", description: "e.g. 'Person' or 'Company'" }, emails: { type: "array", items: { type: "object", properties: { address: { type: "string" }, type: { type: "string" } } } }, phones: { type: "array", items: { type: "object", properties: { number: { type: "string" }, type: { type: "string" } } } }, addresses: { type: "array", items: { type: "object", properties: { street: { type: "string" }, city: { type: "string" }, state: { type: "string" }, postal_code: { type: "string" }, country: { type: "string" } } } }, tags: { type: "array", items: { type: "string" } }, body: { type: "object", additionalProperties: true, description: "Raw API body. If provided, overrides field params." } } } },
    { name: "wealthbox.contacts.update", description: "Update contact. Provide id and changed fields. You can also pass raw body.", inputSchema: { type: "object", properties: { id: { type: "number" }, first_name: { type: "string" }, last_name: { type: "string" }, type: { type: "string" }, emails: { type: "array", items: { type: "object", properties: { address: { type: "string" }, type: { type: "string" } } } }, phones: { type: "array", items: { type: "object", properties: { number: { type: "string" }, type: { type: "string" } } } }, addresses: { type: "array", items: { type: "object", properties: { street: { type: "string" }, city: { type: "string" }, state: { type: "string" }, postal_code: { type: "string" }, country: { type: "string" } } } }, tags: { type: "array", items: { type: "string" } }, body: { type: "object", additionalProperties: true } }, required: ["id"] } },
    { name: "wealthbox.contacts.delete", description: "Delete contact", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    // Tasks
    { name: "wealthbox.tasks.list", description: "List tasks. Query params: title, assigned_to_user_id, assigned_to_team_id, category_id, completed (boolean), due_date (YYYY-MM-DD), updated_since, updated_before, page, per_page.", inputSchema: { type: "object", properties: { query: { type: "object", properties: { title: { type: "string" }, assigned_to_user_id: { type: "number" }, assigned_to_team_id: { type: "number" }, category_id: { type: "number" }, completed: { type: "boolean" }, due_date: { type: "string" }, updated_since: { type: "string" }, updated_before: { type: "string" }, page: { type: "number" }, per_page: { type: "number" } }, additionalProperties: true } } } },
    { name: "wealthbox.tasks.get", description: "Get task by id", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    { name: "wealthbox.tasks.create", description: "Create task. Example: {\"title\":\"Call client\",\"due_date\":\"2025-10-04\"}. You can also provide a raw body.", inputSchema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, due_date: { type: "string", description: "e.g. '2025-10-04'" }, assigned_to_user_id: { type: "number" }, assigned_to_team_id: { type: "number" }, category_id: { type: "number" }, body: { type: "object", additionalProperties: true } } } },
    { name: "wealthbox.tasks.update", description: "Update task by id. You can also pass raw body.", inputSchema: { type: "object", properties: { id: { type: "number" }, title: { type: "string" }, description: { type: "string" }, due_date: { type: "string" }, assigned_to_user_id: { type: "number" }, assigned_to_team_id: { type: "number" }, category_id: { type: "number" }, body: { type: "object", additionalProperties: true } }, required: ["id"] } },
    { name: "wealthbox.tasks.delete", description: "Delete task", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    // Events
    { name: "wealthbox.events.list", description: "List events. Query params: title, category_id, starts_after, starts_before, ends_after, ends_before, updated_since, updated_before, page, per_page.", inputSchema: { type: "object", properties: { query: { type: "object", properties: { title: { type: "string" }, category_id: { type: "number" }, starts_after: { type: "string" }, starts_before: { type: "string" }, ends_after: { type: "string" }, ends_before: { type: "string" }, updated_since: { type: "string" }, updated_before: { type: "string" }, page: { type: "number" }, per_page: { type: "number" } }, additionalProperties: true } } } },
    { name: "wealthbox.events.get", description: "Get event by id", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    { name: "wealthbox.events.create", description: "Create event. Example: {\"title\":\"Review\",\"starts_at\":\"2025-10-04 10:00\",\"ends_at\":\"2025-10-04 11:00\"}", inputSchema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, starts_at: { type: "string" }, ends_at: { type: "string" }, location: { type: "string" }, category_id: { type: "number" }, body: { type: "object", additionalProperties: true } } } },
    { name: "wealthbox.events.update", description: "Update event by id. You can also pass raw body.", inputSchema: { type: "object", properties: { id: { type: "number" }, title: { type: "string" }, description: { type: "string" }, starts_at: { type: "string" }, ends_at: { type: "string" }, location: { type: "string" }, category_id: { type: "number" }, body: { type: "object", additionalProperties: true } }, required: ["id"] } },
    { name: "wealthbox.events.delete", description: "Delete event", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    // Notes
    { name: "wealthbox.notes.list", description: "List notes. Query params: updated_since, updated_before, page, per_page.", inputSchema: { type: "object", properties: { query: { type: "object", properties: { updated_since: { type: "string" }, updated_before: { type: "string" }, page: { type: "number" }, per_page: { type: "number" } }, additionalProperties: true } } } },
    { name: "wealthbox.notes.get", description: "Get note by id", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    { name: "wealthbox.notes.create", description: "Create note. Example: {\"content\": \"Note text\", \"linked_to\": [{\"id\": 12345, \"type\": \"Contact\"}]}", inputSchema: { type: "object", properties: { content: { type: "string", description: "Note text (required if no body provided)" }, linked_to: { type: "array", items: { type: "object", properties: { id: { type: "number" }, type: { type: "string", description: "e.g. 'Contact', 'Project'" } }, required: ["id", "type"] } }, body: { type: "object", additionalProperties: true, description: "Raw API body. If provided, overrides content/linked_to." } } } },
    { name: "wealthbox.notes.update", description: "Update note content by id. You can pass {content} directly, or a raw body.", inputSchema: { type: "object", properties: { id: { type: "number" }, content: { type: "string" }, body: { type: "object", additionalProperties: true } }, required: ["id"] } },
    // Opportunities
    { name: "wealthbox.opportunities.list", description: "List opportunities. Query params: name, pipeline_id, stage_id, amount_min, amount_max, close_after, close_before, updated_since, updated_before, page, per_page.", inputSchema: { type: "object", properties: { query: { type: "object", properties: { name: { type: "string" }, pipeline_id: { type: "number" }, stage_id: { type: "number" }, amount_min: { type: "number" }, amount_max: { type: "number" }, close_after: { type: "string" }, close_before: { type: "string" }, updated_since: { type: "string" }, updated_before: { type: "string" }, page: { type: "number" }, per_page: { type: "number" } }, additionalProperties: true } } } },
    { name: "wealthbox.opportunities.get", description: "Get opportunity by id", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    { name: "wealthbox.opportunities.create", description: "Create opportunity. Example: {\"name\":\"New deal\",\"pipeline_id\":1,\"stage_id\":2,\"amount\":10000}", inputSchema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, pipeline_id: { type: "number" }, stage_id: { type: "number" }, amount: { type: "number" }, close_date: { type: "string" }, primary_contact_id: { type: "number" }, body: { type: "object", additionalProperties: true } } } },
    { name: "wealthbox.opportunities.update", description: "Update opportunity by id. You can also pass raw body.", inputSchema: { type: "object", properties: { id: { type: "number" }, name: { type: "string" }, description: { type: "string" }, pipeline_id: { type: "number" }, stage_id: { type: "number" }, amount: { type: "number" }, close_date: { type: "string" }, primary_contact_id: { type: "number" }, body: { type: "object", additionalProperties: true } }, required: ["id"] } },
    { name: "wealthbox.opportunities.delete", description: "Delete opportunity", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    // Projects
    { name: "wealthbox.projects.list", description: "List projects. Query params: name, status, due_after, due_before, updated_since, updated_before, page, per_page.", inputSchema: { type: "object", properties: { query: { type: "object", properties: { name: { type: "string" }, status: { type: "string" }, due_after: { type: "string" }, due_before: { type: "string" }, updated_since: { type: "string" }, updated_before: { type: "string" }, page: { type: "number" }, per_page: { type: "number" } }, additionalProperties: true } } } },
    { name: "wealthbox.projects.get", description: "Get project by id", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    { name: "wealthbox.projects.create", description: "Create project. Example: {\"name\":\"Onboarding\",\"description\":\"...\"}", inputSchema: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, due_date: { type: "string" }, status: { type: "string" }, body: { type: "object", additionalProperties: true } } } },
    { name: "wealthbox.projects.update", description: "Update project by id. You can also pass raw body.", inputSchema: { type: "object", properties: { id: { type: "number" }, name: { type: "string" }, description: { type: "string" }, due_date: { type: "string" }, status: { type: "string" }, body: { type: "object", additionalProperties: true } }, required: ["id"] } },
    { name: "wealthbox.projects.delete", description: "Delete project", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    // Comments
    { name: "wealthbox.comments.list", description: "List comments (optionally by resource). Query params: resource_id, resource_type, updated_since, updated_before, page, per_page.", inputSchema: { type: "object", properties: { resource_id: { type: "number" }, resource_type: { type: "string" }, updated_since: { type: "string" }, updated_before: { type: "string" }, page: { type: "number" }, per_page: { type: "number" } } } },
    // Metadata
    { name: "wealthbox.userGroups.list", description: "List user groups", inputSchema: { type: "object", properties: {} } },
    { name: "wealthbox.categories.list", description: "List members of a customizable category", inputSchema: { type: "object", properties: { type: { type: "string", enum: ["tags","custom_fields","opportunity_stages","opportunity_pipelines","contact_types","contact_sources","task_categories","event_categories","file_categories","investment_objectives","financial_account_types","email_types","phone_types","address_types","website_types","contact_roles"] } }, required: ["type"] } },
    { name: "wealthbox.tags.list", description: "List tags (optionally by document_type)", inputSchema: { type: "object", properties: { document_type: { type: "string", enum: ["Contact", "Note"] } } } },
    { name: "wealthbox.customFields.list", description: "List custom fields", inputSchema: { type: "object", properties: {} } },
    { name: "wealthbox.contactRoles.list", description: "List contact roles", inputSchema: { type: "object", properties: {} } },
    // Workflows
    { name: "wealthbox.workflows.list", description: "List workflows. Query params: status, template_id, updated_since, updated_before, page, per_page.", inputSchema: { type: "object", properties: { query: { type: "object", properties: { status: { type: "string" }, template_id: { type: "number" }, updated_since: { type: "string" }, updated_before: { type: "string" }, page: { type: "number" }, per_page: { type: "number" } }, additionalProperties: true } } } },
    { name: "wealthbox.workflows.get", description: "Get workflow by id", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    { name: "wealthbox.workflows.create", description: "Create workflow", inputSchema: { type: "object", properties: { body: { type: "object", additionalProperties: true } }, required: ["body"] } },
    { name: "wealthbox.workflows.delete", description: "Delete workflow", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    { name: "wealthbox.workflowTemplates.list", description: "List workflow templates. Query params: page, per_page.", inputSchema: { type: "object", properties: { query: { type: "object", properties: { page: { type: "number" }, per_page: { type: "number" } }, additionalProperties: true } } } },
    { name: "wealthbox.workflowTemplates.get", description: "Get workflow template by id", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    { name: "wealthbox.workflowSteps.complete", description: "Complete a workflow step", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    { name: "wealthbox.workflowSteps.revert", description: "Revert a workflow step", inputSchema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } },
    // Activity Stream
    { name: "wealthbox.activityStream.list", description: "Retrieve activity stream. Query params: updated_since, updated_before, page, per_page.", inputSchema: { type: "object", properties: { query: { type: "object", properties: { updated_since: { type: "string" }, updated_before: { type: "string" }, page: { type: "number" }, per_page: { type: "number" } }, additionalProperties: true } } } },
    // Households
    { name: "wealthbox.households.addMember", description: "Add member to a household. Provide household_id and either id+title or raw body.", inputSchema: { type: "object", properties: { household_id: { type: "number" }, id: { type: "number" }, title: { type: "string", enum: ["Head","Spouse","Partner","Child","Grandchild","Parent","Grandparent","Sibling","Other Dependent"] }, body: { type: "object", additionalProperties: true } }, required: ["household_id"] } },
    { name: "wealthbox.households.deleteMember", description: "Delete member from a household", inputSchema: { type: "object", properties: { household_id: { type: "number" }, id: { type: "number" } }, required: ["household_id", "id"] } },
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
          content: [
            { type: "text", text: "ok" },
            { type: "text", text: JSON.stringify({ ok: true, me: data }, null, 2) }
          ]
        };
      }
      case "wealthbox.getMe": {
        const data = await client.getMe();
        return {
          content: [
            { type: "text", text: "me" },
            { type: "text", text: JSON.stringify(data, null, 2) }
          ]
        };
      }
      case "wealthbox.listUsers": {
        const data = await client.listUsers();
        return {
          content: [
            { type: "text", text: "users" },
            { type: "text", text: JSON.stringify(data, null, 2) }
          ]
        };
      }
      case "wealthbox.listTeams": {
        const data = await client.listTeams();
        return {
          content: [
            { type: "text", text: "teams" },
            { type: "text", text: JSON.stringify(data, null, 2) }
          ]
        };
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
        return {
          content: [
            { type: "text", text: `${method} ${path}` },
            { type: "text", text: JSON.stringify(data, null, 2) }
          ]
        };
      }
      // Contacts
      case "wealthbox.contacts.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        const data = await client.request("GET", "/v1/contacts", undefined, withDefaultPage(query) as any);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.contacts.get": {
        const { id } = args as { id: number };
        const data = await client.request("GET", `/v1/contacts/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.contacts.create": {
        const { body } = args as { body: unknown };
        const data = await client.request("POST", "/v1/contacts", body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.contacts.update": {
        const { id, body } = args as { id: number; body: unknown };
        const data = await client.request("PUT", `/v1/contacts/${id}`, body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.contacts.delete": {
        const { id } = args as { id: number };
        const data = await client.request("DELETE", `/v1/contacts/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      // Tasks
      case "wealthbox.tasks.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        const data = await client.request("GET", "/v1/tasks", undefined, withDefaultPage(query) as any);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.tasks.get": {
        const { id } = args as { id: number };
        const data = await client.request("GET", `/v1/tasks/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.tasks.create": {
        const { body } = args as { body: unknown };
        const data = await client.request("POST", "/v1/tasks", body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.tasks.update": {
        const { id, body } = args as { id: number; body: unknown };
        const data = await client.request("PUT", `/v1/tasks/${id}`, body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.tasks.delete": {
        const { id } = args as { id: number };
        const data = await client.request("DELETE", `/v1/tasks/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      // Events
      case "wealthbox.events.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        const data = await client.request("GET", "/v1/events", undefined, withDefaultPage(query) as any);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.events.get": {
        const { id } = args as { id: number };
        const data = await client.request("GET", `/v1/events/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.events.create": {
        const { body } = args as { body: unknown };
        const data = await client.request("POST", "/v1/events", body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.events.update": {
        const { id, body } = args as { id: number; body: unknown };
        const data = await client.request("PUT", `/v1/events/${id}`, body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.events.delete": {
        const { id } = args as { id: number };
        const data = await client.request("DELETE", `/v1/events/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      // Notes
      case "wealthbox.notes.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        const data = await client.request("GET", "/v1/notes", undefined, withDefaultPage(query) as any);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.notes.get": {
        const { id } = args as { id: number };
        const data = await client.request("GET", `/v1/notes/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.notes.create": {
        const { content, linked_to, body } = (args || {}) as { content?: string; linked_to?: Array<{ id: number; type: string }>; body?: unknown };
        const payload = body ?? { content, linked_to };
        const data = await client.request("POST", "/v1/notes", payload);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.notes.update": {
        const { id, content, body } = (args || {}) as { id: number; content?: string; body?: unknown };
        const payload = body ?? (content !== undefined ? { content } : {});
        const data = await client.request("PUT", `/v1/notes/${id}`, payload);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      // Opportunities
      case "wealthbox.opportunities.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        const data = await client.request("GET", "/v1/opportunities", undefined, withDefaultPage(query) as any);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.opportunities.get": {
        const { id } = args as { id: number };
        const data = await client.request("GET", `/v1/opportunities/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.opportunities.create": {
        const { body } = args as { body: unknown };
        const data = await client.request("POST", "/v1/opportunities", body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.opportunities.update": {
        const { id, body } = args as { id: number; body: unknown };
        const data = await client.request("PUT", `/v1/opportunities/${id}`, body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.opportunities.delete": {
        const { id } = args as { id: number };
        const data = await client.request("DELETE", `/v1/opportunities/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      // Projects
      case "wealthbox.projects.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        const data = await client.request("GET", "/v1/projects", undefined, withDefaultPage(query) as any);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.projects.get": {
        const { id } = args as { id: number };
        const data = await client.request("GET", `/v1/projects/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.projects.create": {
        const { body } = args as { body: unknown };
        const data = await client.request("POST", "/v1/projects", body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.projects.update": {
        const { id, body } = args as { id: number; body: unknown };
        const data = await client.request("PUT", `/v1/projects/${id}`, body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.projects.delete": {
        const { id } = args as { id: number };
        const data = await client.request("DELETE", `/v1/projects/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      // Comments
      case "wealthbox.comments.list": {
        const { resource_id, resource_type, updated_since, updated_before } = (args || {}) as any;
        const query: any = withDefaultPage({});
        if (resource_id !== undefined) query.resource_id = resource_id;
        if (resource_type) query.resource_type = resource_type;
        if (updated_since) query.updated_since = updated_since;
        if (updated_before) query.updated_before = updated_before;
        const data = await client.request("GET", "/v1/comments", undefined, query);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      // Metadata
      case "wealthbox.userGroups.list": {
        const data = await client.request("GET", "/v1/user_groups");
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.categories.list": {
        const { type } = args as { type: string };
        const data = await client.request("GET", `/v1/categories/${encodeURIComponent(type)}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.tags.list": {
        const { document_type } = (args || {}) as { document_type?: string };
        const data = await client.request("GET", "/v1/tags", undefined, document_type ? { document_type } as any : undefined);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.customFields.list": {
        const data = await client.request("GET", "/v1/custom_fields");
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.contactRoles.list": {
        const data = await client.request("GET", "/v1/contact_roles");
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      // Workflows & Templates
      case "wealthbox.workflows.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        const data = await client.request("GET", "/v1/workflows", undefined, withDefaultPage(query) as any);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.workflows.get": {
        const { id } = args as { id: number };
        const data = await client.request("GET", `/v1/workflows/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.workflows.create": {
        const { body } = args as { body: unknown };
        const data = await client.request("POST", "/v1/workflows", body);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.workflows.delete": {
        const { id } = args as { id: number };
        const data = await client.request("DELETE", `/v1/workflows/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.workflowTemplates.list": {
        const data = await client.request("GET", "/v1/workflow_templates", undefined, withDefaultPage({}) as any);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      case "wealthbox.workflowTemplates.get": {
        const { id } = args as { id: number };
        const data = await client.request("GET", `/v1/workflow_templates/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.workflowSteps.complete": {
        const { id } = args as { id: number };
        const data = await client.request("POST", `/v1/workflow_steps/${id}/complete`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.workflowSteps.revert": {
        const { id } = args as { id: number };
        const data = await client.request("POST", `/v1/workflow_steps/${id}/revert`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      // Activity Stream
      case "wealthbox.activityStream.list": {
        const { query } = (args || {}) as { query?: Record<string, unknown> };
        const data = await client.request("GET", "/v1/activity_stream", undefined, withDefaultPage(query) as any);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      // Households
      case "wealthbox.households.addMember": {
        const { household_id, id, title, body } = (args || {}) as { household_id: number; id?: number; title?: string; body?: unknown };
        const payload = body ?? { id, title };
        const data = await client.request("POST", `/v1/households/${household_id}/members`, payload);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
      }
      case "wealthbox.households.deleteMember": {
        const { household_id, id } = args as { household_id: number; id: number };
        const data = await client.request("DELETE", `/v1/households/${household_id}/members/${id}`);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
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



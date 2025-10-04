## wealthbox-mcp

A Model Context Protocol (MCP) server that exposes the Wealthbox CRM API to MCP-enabled clients (e.g., Claude Desktop).

- Wealthbox API docs: https://dev.wealthbox.com/

### Requirements

- Node.js 18+ (uses global fetch)
- A Wealthbox API Access Token (Personal access token)

### Installation

Global install:

```bash
npm i -g wealthbox-mcp
```

Local (from source):

```bash
npm install
npm run build
```

### Configuration

Provide your Wealthbox token via environment variable or a local file:

- `WEALTHBOX_TOKEN` (required): your Wealthbox API access token; sent as `ACCESS_TOKEN` header per docs
- `WEALTHBOX_API_BASE_URL` (optional): defaults to `https://api.crmworkspace.com`
- Optional local file fallback: `wealthbox_key.txt` (first line)

Example (stdio run):

```bash
WEALTHBOX_TOKEN=your_token_here wealthbox-mcp
# or if running from source
WEALTHBOX_TOKEN=your_token_here node dist/index.js
```

### Using with Claude (MCP)

Add to your Claude Desktop config (platform-specific path). Minimal example:

```json
{
  "mcpServers": {
    "wealthbox": {
      "command": "wealthbox-mcp",
      "env": {
        "WEALTHBOX_TOKEN": "YOUR_API_TOKEN"
      }
    }
  }
}
```

After starting Claude, you can ask it to list tools and call them. Example prompts:

- "List all MCP tools from the wealthbox server."
- "Call the wealthbox.health tool and show the full structured JSON."
- "Call the wealthbox.getMe tool and print the full structured JSON."

### Tools Overview

Core tools map to Wealthbox REST endpoints. Many create/update tools accept explicit fields and also an optional raw `body` that overrides field parameters when provided.

- Health and basics
  - `wealthbox.health` – GET `/v1/me` and return ok + profile
  - `wealthbox.getMe` – GET `/v1/me`
  - `wealthbox.listUsers` – GET `/v1/users`
  - `wealthbox.listTeams` – GET `/v1/teams`
  - `wealthbox.request` – Generic caller: `{ method, path, body?, query? }`

- Contacts
  - `wealthbox.contacts.list` – GET `/v1/contacts`
  - `wealthbox.contacts.get` – GET `/v1/contacts/{id}`
  - `wealthbox.contacts.create` – POST `/v1/contacts`
  - `wealthbox.contacts.update` – PUT `/v1/contacts/{id}`
  - `wealthbox.contacts.delete` – DELETE `/v1/contacts/{id}`

- Tasks
  - `wealthbox.tasks.list` – GET `/v1/tasks`
  - `wealthbox.tasks.get` – GET `/v1/tasks/{id}`
  - `wealthbox.tasks.create` – POST `/v1/tasks`
  - `wealthbox.tasks.update` – PUT `/v1/tasks/{id}`
  - `wealthbox.tasks.delete` – DELETE `/v1/tasks/{id}`

- Events
  - `wealthbox.events.list` – GET `/v1/events`
  - `wealthbox.events.get` – GET `/v1/events/{id}`
  - `wealthbox.events.create` – POST `/v1/events`
  - `wealthbox.events.update` – PUT `/v1/events/{id}`
  - `wealthbox.events.delete` – DELETE `/v1/events/{id}`

- Notes
  - `wealthbox.notes.list` – GET `/v1/notes`
  - `wealthbox.notes.get` – GET `/v1/notes/{id}`
  - `wealthbox.notes.create` – POST `/v1/notes`
  - `wealthbox.notes.update` – PUT `/v1/notes/{id}`

- Opportunities
  - `wealthbox.opportunities.list` – GET `/v1/opportunities`
  - `wealthbox.opportunities.get` – GET `/v1/opportunities/{id}`
  - `wealthbox.opportunities.create` – POST `/v1/opportunities`
  - `wealthbox.opportunities.update` – PUT `/v1/opportunities/{id}`
  - `wealthbox.opportunities.delete` – DELETE `/v1/opportunities/{id}`

- Projects
  - `wealthbox.projects.list` – GET `/v1/projects`
  - `wealthbox.projects.get` – GET `/v1/projects/{id}`
  - `wealthbox.projects.create` – POST `/v1/projects`
  - `wealthbox.projects.update` – PUT `/v1/projects/{id}`
  - `wealthbox.projects.delete` – DELETE `/v1/projects/{id}`

- Comments & Activity Stream
  - `wealthbox.comments.list` – GET `/v1/comments{?resource_id,resource_type,updated_since,updated_before}`
  - `wealthbox.activityStream.list` – GET `/v1/activity_stream`

- Metadata & Categories
  - `wealthbox.userGroups.list` – GET `/v1/user_groups`
  - `wealthbox.tags.list` – GET `/v1/tags{?document_type}` (document_type: `Contact` or `Note`)
  - `wealthbox.categories.list` – GET `/v1/categories/{type}` where type ∈ `tags|custom_fields|opportunity_stages|opportunity_pipelines|contact_types|contact_sources|task_categories|event_categories|file_categories|investment_objectives|financial_account_types|email_types|phone_types|address_types|website_types|contact_roles`
  - `wealthbox.customFields.list` – GET `/v1/custom_fields`
  - `wealthbox.contactRoles.list` – GET `/v1/contact_roles`

- Workflows
  - `wealthbox.workflows.list` – GET `/v1/workflows`
  - `wealthbox.workflows.get` – GET `/v1/workflows/{id}`
  - `wealthbox.workflows.create` – POST `/v1/workflows`
  - `wealthbox.workflows.delete` – DELETE `/v1/workflows/{id}`
  - `wealthbox.workflowTemplates.list` – GET `/v1/workflow_templates`
  - `wealthbox.workflowTemplates.get` – GET `/v1/workflow_templates/{id}`
  - `wealthbox.workflowSteps.complete` – POST `/v1/workflow_steps/{id}/complete`
  - `wealthbox.workflowSteps.revert` – POST `/v1/workflow_steps/{id}/revert`

- Households
  - `wealthbox.households.addMember` – POST `/v1/households/{household_id}/members`
  - `wealthbox.households.deleteMember` – DELETE `/v1/households/{household_id}/members/{id}`

### Parameter Hints (selected)

Notes

```json
// wealthbox.notes.create
{
  "content": "Updated with Claude via Wealthbox MCP",
  "linked_to": [{ "id": 12345, "type": "Contact" }]
}
// wealthbox.notes.update
{ "id": 211578273, "content": "New contents" }
```

Tasks

```json
// wealthbox.tasks.create
{ "title": "Call client", "due_date": "2025-10-04", "assigned_to_user_id": 123 }
```

Contacts

```json
// wealthbox.contacts.create
{ "first_name": "Ada", "last_name": "Lovelace", "emails": [{ "address": "ada@example.com", "type": "Work" }] }
```

Households

```json
// wealthbox.households.addMember
{ "household_id": 1, "id": 2, "title": "Head" }
```

Tags/Categories

```json
// wealthbox.tags.list
{ "document_type": "Contact" }

// wealthbox.categories.list
{ "type": "contact_sources" }
```

### Security

- Do not commit your token. The token is loaded from `WEALTHBOX_TOKEN` or a local file (`wealthbox_key.txt`) which is ignored by git and npm.
- The server uses HTTPS to talk to Wealthbox’s API endpoint `https://api.crmworkspace.com`.

### Development

Run locally (stdio):

```bash
npm install
npm run build
WEALTHBOX_TOKEN=$(cat wealthbox_key.txt) node dist/index.js
```

### License

MIT

### Acknowledgements

Built on the TypeScript MCP SDK. See the Wealthbox API docs for full parameter and response details: https://dev.wealthbox.com/
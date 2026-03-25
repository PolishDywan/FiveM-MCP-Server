import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * FiveM Documentation MCP Server
 *
 * Provides tools to search and read the local FiveM markdown documentation.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, "../../content/docs");

// Verify documentation directory exists
async function validateDocsRoot(): Promise<void> {
  try {
    await fs.access(DOCS_ROOT);
  } catch {
    console.error(`Documentation root not found: ${DOCS_ROOT}`);
    throw new Error(`Cannot access documentation directory: ${DOCS_ROOT}`);
  }
}

const tools = [
  {
    name: "search",
    description:
      "Search for keywords in FiveM markdown documentation. Returns matched snippets with file paths.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query (case-insensitive)" },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 15, max: 50)",
          default: 15,
        },
      },
      required: ["q"],
    },
  },
  {
    name: "read",
    description:
      "Read a specific markdown file from the documentation. Returns the full file content.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative path to the .md file (e.g., 'developers/coding-guidelines.md')",
        },
      },
      required: ["path"],
    },
  },
];

const server = new Server(
  { name: "fivem-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Helper to recursively find .md files
async function* getFiles(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* getFiles(res);
    } else if (res.endsWith(".md")) {
      yield res;
    }
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  if (name === "search") {
    const query = String(args?.q || "").toLowerCase().trim();
    const limit = Math.min(Math.max(Number(args?.limit) || 15, 1), 50);

    if (!query) throw new Error("Search query cannot be empty");

    const results: string[] = [];
    let filesSearched = 0;

    for await (const file of getFiles(DOCS_ROOT)) {
      filesSearched++;
      try {
        const content = await fs.readFile(file, "utf8");
        const lowerContent = content.toLowerCase();
        let idx = lowerContent.indexOf(query);

        if (idx !== -1) {
          const relPath = path.relative(DOCS_ROOT, file);
          const start = Math.max(0, idx - 50);
          const end = Math.min(content.length, idx + query.length + 70);
          const snippet = content.slice(start, end).replace(/\s+/g, " ").trim();

          results.push(`📄 ${relPath}\n   ...${snippet}...`);
          if (results.length >= limit) break;
        }
      } catch (e) {
        // Skip files that fail to read
      }
    }

    const summary =
      results.length > 0
        ? `Found ${results.length} match${results.length > 1 ? "es" : ""} (${filesSearched} files searched):\n\n${results.join("\n\n")}`
        : `No matches found for "${query}" (${filesSearched} files searched)`;

    return { content: [{ type: "text", text: summary }] };
  }

  if (name === "read") {
    const relPath = String(args?.path || "").trim();
    if (!relPath) throw new Error("File path cannot be empty");

    // Normalize and sanitize path to prevent directory traversal
    const normalized = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");
    const fullPath = path.resolve(path.join(DOCS_ROOT, normalized));

    // Verify the resolved path is within DOCS_ROOT
    if (!fullPath.startsWith(DOCS_ROOT)) {
      throw new Error(`Access denied: path ${relPath} is outside documentation directory`);
    }

    try {
      const content = await fs.readFile(fullPath, "utf8");
      return { content: [{ type: "text", text: content }] };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read file ${relPath}: ${error}`);
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main(): Promise<void> {
  try {
    await validateDocsRoot();

    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("✓ FiveM MCP Server running (docs: " + DOCS_ROOT + ")\n");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`✗ Fatal error: ${message}\n`);
    process.exit(1);
  }
}

main();


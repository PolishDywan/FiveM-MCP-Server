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

const tools = [
  {
    name: "search",
    description: "Search for keywords in FiveM markdown documentation.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query" },
      },
      required: ["q"],
    },
  },
  {
    name: "read",
    description: "Read a specific markdown file from the documentation.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path to the .md file" },
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
    const query = String(args?.q || "").toLowerCase();
    if (!query) throw new Error("Missing search query");

    const results = [];
    for await (const file of getFiles(DOCS_ROOT)) {
      try {
        const content = await fs.readFile(file, "utf8");
        const idx = content.toLowerCase().indexOf(query);
        
        if (idx !== -1) {
          const relPath = path.relative(DOCS_ROOT, file);
          const start = Math.max(0, idx - 40);
          const end = Math.min(content.length, idx + query.length + 60);
          const snippet = content.slice(start, end).replace(/\s+/g, " ").trim();
          
          results.push(`[${relPath}]\n...${snippet}...`);
          if (results.length >= 15) break;
        }
      } catch (e) {
        // Skip files that fail to read
      }
    }

    return {
      content: [{ 
        type: "text", 
        text: results.length > 0 
          ? `Found matches in:\n\n${results.join("\n\n")}`
          : "No results found." 
      }],
    };
  }

  if (name === "read") {
    const relPath = String(args?.path || "");
    if (!relPath) throw new Error("Missing file path");

    // Basic path sanitation
    const fullPath = path.join(DOCS_ROOT, path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, ""));
    
    if (!fullPath.startsWith(DOCS_ROOT)) {
      throw new Error("Invalid path access attempt");
    }

    try {
      const content = await fs.readFile(fullPath, "utf8");
      return { content: [{ type: "text", text: content }] };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Error reading file: ${relPath}` }],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("FiveM MCP Server active\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.stack || err}\n`);
  process.exit(1);
});

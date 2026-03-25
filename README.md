# FiveM Documentation 📚

Welcome to the FiveM Documentation! This is the official source. You can explore detailed guides, reference materials, and development resources here.

🔗 **Source:** [docs.fivem.net][docs]

### FiveM MCP Server 🤖

This project includes a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that allows AI to search and read local FiveM documentation.

#### Installation
```bash
cd mcp-server
npm install
npm run build
```

#### Claude Desktop Configuration
Add the following configuration to your Claude Desktop config file (typically at `%APPDATA%/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "fivem-mcp": {
      "command": "node",
      "args": ["C:/Users/Admin/Desktop/FiveM-MCP/mcp-server/build/index.js"]
    }
  }
}
```

## Contributing 🚀

If you find any errors in the documentation or issues with the server, please report them directly in this repository.

### Want to Help? 🤝
We love contributions! If you're interested in helping out, check out our [Contribution Guidelines](content/docs/contributing/contribution-guidelines/) to get started.

[docs]: https://docs.fivem.net

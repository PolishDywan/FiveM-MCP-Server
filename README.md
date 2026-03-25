# FiveM Documentation 📚

Welcome to the FiveM Documentation! This is the official source. You can explore detailed guides, reference materials, and development resources here.

🔗 **Source:** [docs.fivem.net][docs]

### FiveM MCP Server 🤖

Ten projekt zawiera serwer [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), który pozwala AI przeszukiwać i czytać lokalną dokumentację FiveM.

#### Instalacja
```bash
cd mcp-server
npm install
npm run build
```

#### Konfiguracja Claude Desktop
Dodaj poniższy fragment do konfiguracji (np. `%APPDATA%/Claude/claude_desktop_config.json`):
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

## Rozwój 🚀

Jeśli znajdziesz błędy w dokumentacji lub działaniu serwera, zgłoś je bezpośrednio w tym repozytorium.

### Chcesz pomóc? 🤝
Doceniamy każdą pomoc! Zapoznaj się z [wytycznymi dotyczącymi wkładu](content/docs/contributing/contribution-guidelines/).


We love contributions! If you're interested in helping out, check out our [Contribution Guidelines](content/docs/contributing/contribution-guidelines/) to get started.

[docs]: https://docs.fivem.net

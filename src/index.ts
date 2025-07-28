import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  InitializeRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 10000;

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// SSE endpoint for MCP
app.get("/sse", (req, res) => {
  console.log("SSE connection established.");

  const mcpServer = new Server(
    {
      name: "employee-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  mcpServer.setRequestHandler(InitializeRequestSchema, async (request) => {
    console.log("Initialize request received:", request.params);
    return {
      protocolVersion: "2024-11-05",
      serverInfo: {
        name: "employee-server",
        version: "1.0.0",
      },
      capabilities: {
        tools: {},
      },
    };
  });

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    console.log("ListTools request received.");
    return {
      tools: [
        {
          name: "get_all_employees",
          description: "Get a list of all employees.",
          inputSchema: { type: "object", properties: {} },
        },
      ],
    };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    console.log("CallTool request received:", request.params);
    if (request.params.name === "get_all_employees") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify([
              { id: 1, name: "Taro Yamada", department: "Sales" },
              { id: 2, name: "Hanako Tanaka", department: "Engineering" },
            ]),
          },
        ],
      };
    }
    return {
      content: [{ type: "text", text: "Unknown tool" }],
      isError: true,
    };
  });

  const transport = new SSEServerTransport("/sse", res);
  mcpServer.connect(transport).catch((e) => console.error(e));

  req.on("close", () => {
    console.log("SSE connection closed.");
    transport.close();
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`MCP endpoint: http://localhost:${port}/sse`);
});

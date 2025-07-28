import dotenv from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { Employee, sampleEmployees } from "./types.js";
import express from "express";
import cors from "cors";
import { SimpleMCPAuth } from "./simple-auth.js";

dotenv.config();

class EmployeeMCPServer {
  private server: Server;
  private auth: SimpleMCPAuth;

  constructor() {
    this.server = new Server(
      {
        name: "employee-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.auth = new SimpleMCPAuth();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.setupHandlersForServer(this.server);
  }

  private setupHandlersForServer(server: Server) {
    // ツールリストの取得
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "get_all_employees",
            description: "全従業員のリストを取得します",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_employee_by_id",
            description: "指定されたIDの従業員情報を取得します",
            inputSchema: {
              type: "object",
              properties: {
                id: {
                  type: "number",
                  description: "従業員ID",
                },
              },
              required: ["id"],
            },
          },
          {
            name: "get_employees_by_department",
            description: "指定された部署の従業員リストを取得します",
            inputSchema: {
              type: "object",
              properties: {
                department: {
                  type: "string",
                  description: "部署名",
                },
              },
              required: ["department"],
            },
          },
        ],
      };
    });

    // ツール実行
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "get_all_employees":
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(sampleEmployees, null, 2),
              },
            ],
          };

        case "get_employee_by_id":
          const id = (args as any).id;
          const employee = sampleEmployees.find((emp) => emp.id === id);
          if (!employee) {
            return {
              content: [
                {
                  type: "text",
                  text: `従業員ID ${id} が見つかりません`,
                },
              ],
              isError: true,
            };
          }
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(employee, null, 2),
              },
            ],
          };

        case "get_employees_by_department":
          const department = (args as any).department;
          const employees = sampleEmployees.filter(
            (emp) => emp.department === department
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(employees, null, 2),
              },
            ],
          };

        default:
          return {
            content: [
              {
                type: "text",
                text: `未知のツール: ${name}`,
              },
            ],
            isError: true,
          };
      }
    });
  }

  async run() {
    // コマンドライン引数をチェック
    const args = process.argv.slice(2);
    const useStdio = args.includes('--stdio');

    if (useStdio) {
      // STDIO モード（Claude Desktop用）
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("Employee MCP Server running on stdio");
    } else {
      // HTTP/SSE モード（Anthropic API用）
      const app = express();
      app.use(cors());
      app.use(express.json());

      // SimpleMCPAuth のルートを設定
      this.auth.setupRoutes(app);

      // Health check endpoint
      app.get("/health", (req, res) => {
        res.json({ status: "healthy", timestamp: new Date().toISOString() });
      });

      // SSE endpoint for MCP (no authentication)
      app.get("/sse", async (req, res) => {
        console.log('=== SSE connection requested ===');
        console.log('IP:', req.ip);
        console.log('User-Agent:', req.headers['user-agent']);
        console.log('Headers:', req.headers);
        
        try {
          console.log('Creating SSEServerTransport...');
          // Create a new server instance for each SSE connection
          const mcpServer = new Server(
            {
              name: "employee-mcp-server",
              version: "1.0.0",
            },
            {
              capabilities: {
                tools: {},
              },
            }
          );

          // Setup handlers for this server instance
          this.setupHandlersForServer(mcpServer);
          
          // Let SSEServerTransport handle headers - don't set them ourselves
          const transport = new SSEServerTransport("/sse", res);
          
          console.log('Attempting to connect MCP server...');
          await mcpServer.connect(transport);
          console.log('✅ MCP Server connected successfully via SSE');
          
        } catch (error) {
          console.error('❌ SSE connection error:', error);
          
          // Only send error response if headers haven't been sent yet
          if (!res.headersSent) {
            const errorData = {
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            };
            res.status(500).json({ error: 'Failed to establish SSE connection', details: errorData });
          }
          return;
        }

        // Handle connection close
        req.on('close', () => {
          console.log('SSE connection closed by client');
        });

        req.on('error', (error) => {
          console.error('SSE request error:', error);
        });

        res.on('error', (error) => {
          console.error('SSE response error:', error);
        });
      });

      // REST API endpoints (no authentication)
      app.get("/api/employees", (req, res) => {
        res.json(sampleEmployees);
      });

      app.get("/api/employees/:id", (req, res) => {
        const id = parseInt(req.params.id);
        const employee = sampleEmployees.find((emp) => emp.id === id);
        
        if (!employee) {
          return res.status(404).json({ error: "従業員が見つかりません" });
        }

        res.json(employee);
      });

      app.get("/api/employees/department/:department", (req, res) => {
        const department = req.params.department;
        const employees = sampleEmployees.filter(
          (emp) => emp.department === department
        );

        res.json(employees);
      });

      const port = process.env.PORT || 3000;
      app.listen(port, () => {
        console.log(`Employee MCP Server running on port ${port}`);
        console.log(`MCP endpoint: http://localhost:${port}/sse`);
        console.log(`REST API: http://localhost:${port}/api/employees`);
      });
    }
  }
}

const server = new EmployeeMCPServer();
server.run().catch(console.error);

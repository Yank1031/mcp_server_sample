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
    // ツールリストの取得
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
            description: "IDで指定した従業員の情報を取得します",
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
            description: "部署で絞り込んだ従業員のリストを取得します",
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

    // ツールの実行
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
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

        case "get_employee_by_id": {
          const id = args?.id as number;
          const employee = sampleEmployees.find((emp) => emp.id === id);
          
          if (!employee) {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ error: "従業員が見つかりません" }, null, 2),
                },
              ],
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
        }

        case "get_employees_by_department": {
          const department = args?.department as string;
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
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
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
        
        // SSE headers
        const headers = {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control, Authorization',
          'X-Accel-Buffering': 'no'
        };
        
        res.writeHead(200, headers);
        console.log('SSE headers sent');

        // Send initial connection event
        res.write(`event: connected\ndata: {"status": "connected", "timestamp": "${new Date().toISOString()}"}\n\n`);
        console.log('Initial connection event sent');

        try {
          console.log('Creating SSEServerTransport...');
          const transport = new SSEServerTransport("/sse", res);
          
          console.log('Attempting to connect MCP server...');
          await this.server.connect(transport);
          console.log('✅ MCP Server connected successfully via SSE');
          
          // Send success event
          res.write(`event: mcp_ready\ndata: {"status": "ready", "timestamp": "${new Date().toISOString()}"}\n\n`);
          console.log('MCP ready event sent');
          
        } catch (error) {
          console.error('❌ SSE connection error:', error);
          const errorData = {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          };
          res.write(`event: error\ndata: ${JSON.stringify(errorData)}\n\n`);
          
          // Don't end the connection immediately, give time for error to be sent
          setTimeout(() => {
            res.end();
          }, 1000);
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

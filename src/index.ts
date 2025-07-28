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
import { authenticateToken } from "./middleware.js";
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

      // Setup OAuth-compatible endpoints
      this.auth.setupRoutes(app);

      // Health check endpoint
      app.get("/health", (req, res) => {
        res.json({ status: "healthy", timestamp: new Date().toISOString() });
      });

      // OAuth-compatible authentication middleware
      const bearerAuth = (req: any, res: any, next: any) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Authorization required', error_description: 'Bearer token required' });
        }

        const token = authHeader.substring(7);
        const tokenData = this.auth.validateAccessToken(token);
        
        if (!tokenData) {
          return res.status(401).json({ error: 'Invalid or expired access token' });
        }

        req.tokenData = tokenData;
        next();
      };

      // SSE endpoint for MCP (with Bearer token authentication)
      app.get("/sse", bearerAuth, (req, res) => {
        const transport = new SSEServerTransport("/sse", res);
        this.server.connect(transport);
      });

      // REST API endpoints (with Bearer token authentication)
      app.get("/api/employees", bearerAuth, (req, res) => {
        res.json(sampleEmployees);
      });

      app.get("/api/employees/:id", bearerAuth, (req, res) => {
        const id = parseInt(req.params.id);
        const employee = sampleEmployees.find((emp) => emp.id === id);
        
        if (!employee) {
          return res.status(404).json({ error: "従業員が見つかりません" });
        }

        res.json(employee);
      });

      app.get("/api/employees/department/:department", bearerAuth, (req, res) => {
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

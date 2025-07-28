const express = require('express');
const cors = require('cors');

// 従業員データベース（メモリ内）
class EmployeeDatabase {
  constructor() {
    this.employees = new Map();
    this.nextId = 1;
    this.initializeSampleData();
  }

  initializeSampleData() {
    const sampleEmployees = [
      {
        name: '田中太郎',
        email: 'tanaka@example.com',
        department: '開発部',
        position: 'シニアエンジニア',
        hireDate: '2020-04-01',
        salary: 8000000
      },
      {
        name: '佐藤花子',
        email: 'sato@example.com',
        department: 'マーケティング部',
        position: 'マネージャー',
        hireDate: '2019-07-15',
        salary: 7500000
      },
      {
        name: '鈴木次郎',
        email: 'suzuki@example.com',
        department: '営業部',
        position: '営業担当',
        hireDate: '2021-01-10',
        salary: 6000000
      }
    ];

    sampleEmployees.forEach(emp => {
      const employee = {
        ...emp,
        id: this.nextId.toString()
      };
      this.employees.set(employee.id, employee);
      this.nextId++;
    });
  }

  getAllEmployees() {
    return Array.from(this.employees.values());
  }

  getEmployeeById(id) {
    return this.employees.get(id);
  }

  getEmployeesByDepartment(department) {
    return Array.from(this.employees.values())
      .filter(emp => emp.department.toLowerCase().includes(department.toLowerCase()));
  }

  createEmployee(data) {
    const employee = {
      id: this.nextId.toString(),
      ...data,
      hireDate: new Date().toISOString().split('T')[0]
    };
    
    this.employees.set(employee.id, employee);
    this.nextId++;
    
    return employee;
  }

  updateEmployee(id, data) {
    const employee = this.employees.get(id);
    if (!employee) {
      return null;
    }

    const updatedEmployee = {
      ...employee,
      ...data
    };

    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }

  deleteEmployee(id) {
    return this.employees.delete(id);
  }

  searchEmployees(query) {
    const searchTerm = query.toLowerCase();
    return Array.from(this.employees.values())
      .filter(emp => 
        emp.name.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.department.toLowerCase().includes(searchTerm) ||
        emp.position.toLowerCase().includes(searchTerm)
      );
  }
}

// SSE MCPサーバー
class SSEMCPServer {
  constructor() {
    this.app = express();
    this.database = new EmployeeDatabase();
    this.connections = new Map();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-API-Key', 'anthropic-version', 'anthropic-beta'],
    }));
    this.app.use(express.json());
  }

  setupRoutes() {
    // ヘルスチェックエンドポイント
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // SSEエンドポイント
    this.app.get('/sse', (req, res) => {
      // SSE headers設定
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      const connectionId = Date.now().toString();
      this.connections.set(connectionId, res);

      // 接続確立メッセージ
      this.sendSSEMessage(res, {
        type: 'connection',
        data: {
          message: 'Connected to MCP Employee Server',
          connectionId,
          capabilities: {
            tools: {},
          },
        },
      });

      // 接続が閉じられた時の処理
      req.on('close', () => {
        this.connections.delete(connectionId);
      });

      req.on('error', () => {
        this.connections.delete(connectionId);
      });
    });

    // MCPリクエスト処理エンドポイント
    this.app.post('/mcp', async (req, res) => {
      try {
        const mcpRequest = req.body;
        
        // JSONRPCの基本検証
        if (!mcpRequest.jsonrpc || mcpRequest.jsonrpc !== '2.0') {
          return res.status(400).json({
            jsonrpc: '2.0',
            id: mcpRequest.id || null,
            error: {
              code: -32600,
              message: 'Invalid Request: jsonrpc must be "2.0"',
            },
          });
        }

        // メソッドの処理
        let result;
        
        switch (mcpRequest.method) {
          case 'tools/list':
            result = await this.handleListTools();
            break;
          
          case 'tools/call':
            result = await this.handleCallTool(mcpRequest.params);
            break;
          
          default:
            return res.status(400).json({
              jsonrpc: '2.0',
              id: mcpRequest.id,
              error: {
                code: -32601,
                message: `Method not found: ${mcpRequest.method}`,
              },
            });
        }

        const response = {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          result,
        };

        // 結果をSSE経由でも送信
        this.broadcastSSEMessage({
          type: 'mcp_response',
          data: response,
        });

        res.json(response);
      } catch (error) {
        const errorResponse = {
          jsonrpc: '2.0',
          id: req.body.id || null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error.message,
          },
        };

        res.status(500).json(errorResponse);
      }
    });
  }

  async handleListTools() {
    return {
      tools: [
        {
          name: 'list_employees',
          description: '全従業員の一覧を取得します',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_employee',
          description: '指定されたIDの従業員情報を取得します',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '従業員ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'search_employees',
          description: '従業員を検索します（名前、メール、部署、役職で検索）',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '検索クエリ',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_employees_by_department',
          description: '指定された部署の従業員一覧を取得します',
          inputSchema: {
            type: 'object',
            properties: {
              department: {
                type: 'string',
                description: '部署名',
              },
            },
            required: ['department'],
          },
        },
        {
          name: 'create_employee',
          description: '新しい従業員を作成します',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: '従業員名',
              },
              email: {
                type: 'string',
                description: 'メールアドレス',
              },
              department: {
                type: 'string',
                description: '部署名',
              },
              position: {
                type: 'string',
                description: '役職',
              },
              salary: {
                type: 'number',
                description: '給与（オプション）',
              },
            },
            required: ['name', 'email', 'department', 'position'],
          },
        },
        {
          name: 'update_employee',
          description: '従業員情報を更新します',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '従業員ID',
              },
              name: {
                type: 'string',
                description: '従業員名（オプション）',
              },
              email: {
                type: 'string',
                description: 'メールアドレス（オプション）',
              },
              department: {
                type: 'string',
                description: '部署名（オプション）',
              },
              position: {
                type: 'string',
                description: '役職（オプション）',
              },
              salary: {
                type: 'number',
                description: '給与（オプション）',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'delete_employee',
          description: '従業員を削除します',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '従業員ID',
              },
            },
            required: ['id'],
          },
        },
      ],
    };
  }

  async handleCallTool(params) {
    if (!params || !params.name) {
      throw new Error('Tool name is required');
    }

    const { name, arguments: args } = params;

    switch (name) {
      case 'list_employees':
        const employees = this.database.getAllEmployees();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(employees, null, 2),
            },
          ],
        };

      case 'get_employee':
        const employee = this.database.getEmployeeById(args.id);
        if (!employee) {
          throw new Error(`従業員ID ${args.id} が見つかりません`);
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(employee, null, 2),
            },
          ],
        };

      case 'search_employees':
        const searchResults = this.database.searchEmployees(args.query);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(searchResults, null, 2),
            },
          ],
        };

      case 'get_employees_by_department':
        const deptEmployees = this.database.getEmployeesByDepartment(args.department);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(deptEmployees, null, 2),
            },
          ],
        };

      case 'create_employee':
        const newEmployee = this.database.createEmployee(args);
        return {
          content: [
            {
              type: 'text',
              text: `従業員が作成されました:\n${JSON.stringify(newEmployee, null, 2)}`,
            },
          ],
        };

      case 'update_employee':
        const { id, ...updateData } = args;
        const updatedEmployee = this.database.updateEmployee(id, updateData);
        if (!updatedEmployee) {
          throw new Error(`従業員ID ${id} が見つかりません`);
        }
        return {
          content: [
            {
              type: 'text',
              text: `従業員情報が更新されました:\n${JSON.stringify(updatedEmployee, null, 2)}`,
            },
          ],
        };

      case 'delete_employee':
        const deleted = this.database.deleteEmployee(args.id);
        if (!deleted) {
          throw new Error(`従業員ID ${args.id} が見つかりません`);
        }
        return {
          content: [
            {
              type: 'text',
              text: `従業員ID ${args.id} が削除されました`,
            },
          ],
        };

      default:
        throw new Error(`未知のツール: ${name}`);
    }
  }

  sendSSEMessage(res, message) {
    const data = JSON.stringify(message);
    res.write(`data: ${data}\n\n`);
  }

  broadcastSSEMessage(message) {
    this.connections.forEach((res) => {
      this.sendSSEMessage(res, message);
    });
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`SSE MCP Server is running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
      console.log(`SSE endpoint: http://localhost:${port}/sse`);
      console.log(`MCP endpoint: http://localhost:${port}/mcp`);
    });
  }
}

// メイン関数
async function main() {
  try {
    // ポート番号を環境変数から取得（Renderで自動設定される）
    const port = parseInt(process.env.PORT || '3000', 10);
    
    // SSE MCPサーバーを起動
    const server = new SSEMCPServer();
    server.start(port);

    console.log(`Employee MCP Server started successfully on port ${port}`);
    console.log('Available endpoints:');
    console.log(`- Health check: http://localhost:${port}/health`);
    console.log(`- SSE endpoint: http://localhost:${port}/sse`);
    console.log(`- MCP endpoint: http://localhost:${port}/mcp`);
    
    // プロセス終了時の処理
    process.on('SIGINT', () => {
      console.log('\nShutting down server...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\nReceived SIGTERM, shutting down server...');
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// サーバー起動
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

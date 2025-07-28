# Employee MCP Server with SSE

SSE (Server-Sent Events) を利用したMCP (Model Context Protocol) サーバーです。従業員情報の管理機能を提供します。

## 機能

- 従業員情報の CRUD 操作
- 部署別従業員検索
- 従業員名・メール・部署・役職での検索機能
- SSE (Server-Sent Events) によるリアルタイム通信
- JSON-RPC 2.0 プロトコル対応
- バッチリクエスト対応

## API エンドポイント

### ヘルスチェック
```
GET /health
```

### SSE 接続
```
GET /sse
```

### MCP リクエスト
```
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

### MCP バッチリクエスト
```
POST /mcp/batch
Content-Type: application/json

[
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  },
  {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "list_employees",
      "arguments": {}
    }
  }
]
```

## 利用可能なツール

1. **list_employees**: 全従業員の一覧を取得
2. **get_employee**: 指定IDの従業員情報を取得
3. **search_employees**: 従業員を検索
4. **get_employees_by_department**: 部署別従業員一覧を取得
5. **create_employee**: 新しい従業員を作成
6. **update_employee**: 従業員情報を更新
7. **delete_employee**: 従業員を削除

## 使用例

### 従業員一覧の取得
```bash
curl -X POST https://employee-mcp-server.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_employees",
      "arguments": {}
    }
  }'
```

### 従業員検索
```bash
curl -X POST https://employee-mcp-server.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_employees",
      "arguments": {
        "query": "田中"
      }
    }
  }'
```

### 新しい従業員の作成
```bash
curl -X POST https://employee-mcp-server.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_employee",
      "arguments": {
        "name": "山田太郎",
        "email": "yamada@example.com",
        "department": "開発部",
        "position": "エンジニア",
        "salary": 7000000
      }
    }
  }'
```

## Anthropic Claude との連携

以下のcurlコマンドでClaude APIと連携できます：

```bash
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-04-04" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "利用可能なツールを教えてください"}],
    "mcp_servers": [
      {
        "type": "url",
        "url": "https://employee-mcp-server.onrender.com/sse",
        "name": "employee-server"
      }
    ]
  }'
```

## 開発・デプロイ

### ローカル開発
```bash
npm install
npm run dev
```

### ビルド
```bash
npm run build
```
*注意: このプロジェクトはJavaScriptベースのため、実際のビルド処理は不要です*

### 本番起動
```bash
npm start
```

## 環境変数

- `PORT`: サーバーのポート番号（デフォルト: 3000）

## 技術スタック

- **Runtime**: Node.js
- **Language**: JavaScript
- **Framework**: Express.js
- **Protocol**: MCP (Model Context Protocol)
- **Transport**: SSE (Server-Sent Events)
- **Deploy**: Render

## サンプルデータ

初期状態で以下のサンプル従業員データが含まれています：

1. 田中太郎 - 開発部 - シニアエンジニア
2. 佐藤花子 - マーケティング部 - マネージャー
3. 鈴木次郎 - 営業部 - 営業担当

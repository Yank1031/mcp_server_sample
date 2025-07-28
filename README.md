# Employee MCP Server

従業員データを提供するModel Context Protocol (MCP) サーバーです。

## 機能

- 全従業員データの取得
- ID別従業員検索
- 部署別従業員検索
- REST API エンドポイント

## インストール

```bash
npm install
```

## 使用方法

### 開発モード（HTTPサーバー）

```bash
npm run dev
```

### STDIOモード（Claude Desktop用）

```bash
npm run dev:stdio
```

### プロダクションビルド

```bash
npm run build
npm start        # HTTPサーバーモード
npm run start:stdio  # STDIOモード
```

## API エンドポイント

サーバーは以下のエンドポイントを提供します：

### MCP エンドポイント
- `GET /sse` - Server-Sent Events による MCP 接続

### REST API エンドポイント
- `GET /api/employees` - 全従業員データを取得
- `GET /api/employees/:id` - ID で指定した従業員データを取得
- `GET /api/employees/department/:department` - 部署別従業員データを取得

## MCP ツール

このサーバーは以下のMCPツールを提供します：

1. `get_all_employees` - 全従業員のリストを取得
2. `get_employee_by_id` - IDで指定した従業員情報を取得
3. `get_employees_by_department` - 部署で絞り込んだ従業員リストを取得

## 使用例

### Claude Desktop での設定

Claude Desktop でこのMCPサーバーを使用するには、設定ファイルを編集します：

#### 1. Claude Desktop 設定ファイルを編集

**macOS の場合:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows の場合:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**推奨設定（プロダクション用）:**
```json
{
  "mcpServers": {
    "employee-server": {
      "command": "node",
      "args": ["dist/index.js", "--stdio"],
      "cwd": "/path/to/your/mcp_server_url",
      "env": {
        "AUTHORIZATION_TOKEN": "your-secret-token"
      }
    }
  }
}
```

**開発用設定:**
```json
{
  "mcpServers": {
    "employee-server": {
      "command": "npm",
      "args": ["run", "dev:stdio"],
      "cwd": "/path/to/your/mcp_server_url",
      "env": {
        "AUTHORIZATION_TOKEN": "your-secret-token"
      }
    }
  }
}
```

#### 2. プロジェクトをビルド（プロダクション用設定の場合）

```bash
npm run build
```

#### 3. Claude Desktop を再起動

設定を反映するためにClaude Desktopを再起動してください。

#### 4. 使用方法

Claude Desktop で以下のようにMCPツールを使用できます：

- 「全従業員のリストを表示して」
- 「ID 1の従業員情報を教えて」  
- 「開発部の従業員を一覧表示して」

### Anthropic API での使用例

Anthropic APIでSSEエンドポイント経由でMCPサーバーを使用する場合：

#### 1. サーバーをHTTPモードで起動

```bash
npm run dev
# または
PORT=3000 AUTHORIZATION_TOKEN=your-secret-token npm run dev
```

#### 2. Anthropic API でMCPサーバーを使用

```bash
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-04-04" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "全従業員のリストを取得してください"}],
    "mcp_servers": [
      {
        "type": "url",
        "url": "http://localhost:3000/sse",
        "name": "employee-mcp",
        "authorization_token": "your-secret-token"
      }
    ]
  }'
```

#### 3. 直接REST API を使用

```bash
# 全従業員データを取得
curl -H "authorization-token: your-secret-token" http://localhost:3000/api/employees

# 特定の従業員を取得
curl -H "authorization-token: your-secret-token" http://localhost:3000/api/employees/1

# 部署別従業員を取得
curl -H "authorization-token: your-secret-token" "http://localhost:3000/api/employees/department/開発部"
```

## 環境変数設定

`.env` ファイルを作成して設定してください：

```bash
cp .env.example .env
```

`.env` ファイルの内容：
```
PORT=3000
AUTHORIZATION_TOKEN=your-secret-token-here
```

**注意**: `AUTHORIZATION_TOKEN` を設定しない場合、認証は無効になります。

## Claude Desktop 設定ファイル例

プロジェクトには Claude Desktop 用の設定ファイル例が含まれています：

- `claude_desktop_config.json.example` - プロダクション用設定（推奨）
- `claude_desktop_config_dev.json.example` - 開発用設定

**重要:** Claude DesktopではSTDIO接続を使用します。SSE/URL接続はAnthropic API専用です。

これらのファイルをコピーして、`cwd`パスを実際のプロジェクトパスに変更してください。

## テストスクリプト

プロジェクトには複数のテストスクリプトが含まれています：

### 1. 基本テスト（無料）
```bash
./test_mcp_basic.sh
```
- MCPサーバーの基本動作を確認
- REST APIエンドポイントをテスト
- SSEエンドポイントの可用性を確認

### 2. REST APIテスト
```bash
./test.sh
```
- 直接REST APIをテスト
- 認証機能の動作確認

### 3. Anthropic APIテスト（課金対象）
```bash
export ANTHROPIC_API_KEY=your-api-key-here
./test_anthropic_api.sh
```
- 実際のAnthropic API経由でMCPサーバーをテスト
- MCPツールの呼び出しをテスト
- **注意**: このテストはAnthropic APIの利用料金が発生します

### テスト実行手順

1. **サーバーを起動**:
   ```bash
   npm run dev
   ```

2. **基本テストを実行**:
   ```bash
   ./test_mcp_basic.sh
   ```

3. **Anthropic APIテストを実行**（オプション）:
   ```bash
   export ANTHROPIC_API_KEY=your-actual-api-key
   ./test_anthropic_api.sh  # ローカル版（ngrok等が必要）
   ./test_render.sh         # Render版（デプロイ後）
   ```

## クラウドデプロイ（Anthropic API用）

Anthropic APIからMCPサーバーにアクセスするには、サーバーをインターネット上に公開する必要があります。

### Renderでのデプロイ（推奨）

このプロジェクトはRenderでの簡単デプロイ用に最適化されています：

1. **デプロイ手順**: [DEPLOY_RENDER.md](DEPLOY_RENDER.md) を参照
2. **特徴**:
   - 無料プラン利用可能
   - 固定URL（例: `https://your-app.onrender.com`）
   - GitHubと連携した自動デプロイ
   - HTTPS対応

### デプロイ後のテスト

Renderにデプロイ後、専用テストスクリプトでテストできます：

```bash
# 環境変数を設定
export RENDER_APP_NAME=your-deployed-app-name
export ANTHROPIC_API_KEY=your-api-key
export AUTH_TOKEN=your-secret-token

# Render専用テストを実行
./test_render.sh
```

**注意事項**:
- Render無料プランでは15分間非アクティブで自動スリープ
- 初回アクセス時に30-60秒の起動時間が必要
- テストスクリプトは自動的にサーバーをウェイクアップ

## サンプルデータ

サーバーには以下のサンプル従業員データが含まれています：

- 田中太郎 (開発部, シニアエンジニア)
- 佐藤花子 (営業部, 営業マネージャー)
- 鈴木一郎 (人事部, 人事担当)
- 高橋美咲 (開発部, フロントエンドエンジニア)
- 山田健太 (マーケティング部, マーケティングスペシャリスト)

## ポート設定

デフォルトポートは 3000 です。環境変数 `PORT` で変更可能です：

```bash
PORT=8080 npm start
```

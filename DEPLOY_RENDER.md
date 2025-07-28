# Employee MCP Server - Render Deployment

## Renderでのデプロイ手順

### 1. GitHubリポジトリの準備
```bash
# Gitリポジトリを初期化（まだの場合）
git init

# ファイルを追加
git add .
git commit -m "Initial commit: Employee MCP Server"

# GitHubでリポジトリを作成し、プッシュ
git remote add origin https://github.com/yourusername/mcp-employee-server.git
git branch -M main
git push -u origin main
```

### 2. Renderでのデプロイ設定

#### 方法1: Web UIでのデプロイ（推奨）

1. [Render](https://render.com) にアクセスしてアカウント作成
2. "New Web Service" を選択
3. GitHubリポジトリを接続
4. 以下の設定を入力：

**基本設定:**
- **Name**: `employee-mcp-server`（または任意の名前）
- **Region**: `Oregon (US West)`
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**環境変数:**
- `AUTHORIZATION_TOKEN`: `your-secret-token-here`
- `NODE_ENV`: `production`

**Advanced設定:**
- **Health Check Path**: `/health`
- **Auto-Deploy**: `Yes`

#### 方法2: Blueprintでのデプロイ

プロジェクトに `render.yaml` が含まれているので、以下の手順でも可能：

1. Renderダッシュボードで "New Blueprint" を選択
2. GitHubリポジトリを接続
3. `render.yaml` が自動的に検出される
4. 環境変数 `AUTHORIZATION_TOKEN` を設定

### 3. デプロイ完了の確認

デプロイが完了すると、以下のようなURLが表示されます：
```
https://employee-mcp-server-xxxx.onrender.com
```

ヘルスチェックでサーバーの動作を確認：
```bash
curl https://your-app-name.onrender.com/health
```

### 4. MCPエンドポイント

デプロイ後のMCPエンドポイント：
```
https://your-app-name.onrender.com/sse
```

REST APIエンドポイント：
```
https://your-app-name.onrender.com/api/employees
```

## 利点
- 無料プラン利用可能
- 固定URL
- GitHubと連携した自動デプロイ
- HTTPS対応

## 注意点
- 無料プランでは30分間非アクティブで自動スリープ
- 初回アクセス時に起動に時間がかかる場合がある

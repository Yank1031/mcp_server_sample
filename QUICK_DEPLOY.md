# 🚀 Employee MCP Server - デプロイ完了！

## ✅ GitHubプッシュ完了

リポジトリ: https://github.com/Yank1031/mcp_server_sample.git

## 📋 次のステップ: Renderでのデプロイ

### 1. Renderアカウント作成
1. [Render](https://render.com) にアクセス
2. GitHubアカウントでサインアップ

### 2. Web Service作成
1. ダッシュボードで "New Web Service" をクリック
2. "Connect a repository" を選択
3. `Yank1031/mcp_server_sample` を選択

### 3. デプロイ設定
```
Name: employee-mcp-server (または任意の名前)
Region: Oregon (US West)
Branch: main
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### 4. 環境変数設定
```
AUTHORIZATION_TOKEN: your-secret-token-here
NODE_ENV: production
```

### 5. デプロイ実行
"Create Web Service" をクリックしてデプロイ開始

## 🧪 デプロイ後のテスト

デプロイ完了後のURL例: `https://employee-mcp-server-abc123.onrender.com`

### テスト実行コマンド:
```bash
# 環境変数を設定
export RENDER_APP_NAME=employee-mcp-server-abc123  # 実際のapp名に変更
export ANTHROPIC_API_KEY=your-api-key
export AUTH_TOKEN=your-secret-token

# テスト実行
./test_render.sh
```

## 💡 重要なポイント

- **無料プラン**: 15分間非アクティブで自動スリープ
- **起動時間**: スリープ後の初回アクセスで30-60秒かかる
- **固定URL**: デプロイ後はURLが固定される
- **自動デプロイ**: GitHubへのプッシュで自動更新

## 🔗 参考資料

- 詳細なデプロイ手順: [DEPLOY_RENDER.md](DEPLOY_RENDER.md)
- プロジェクト概要: [README.md](README.md)

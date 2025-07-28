# Employee MCP Server - Vercel Deployment

## Vercelでのデプロイ手順

### 1. Vercel設定ファイルの作成

プロジェクトルートに `vercel.json` を作成：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/index.js"
    }
  ],
  "env": {
    "AUTHORIZATION_TOKEN": "@authorization-token"
  }
}
```

### 2. デプロイ
```bash
npm install -g vercel
vercel --prod
```

### 3. 環境変数設定
```bash
vercel env add AUTHORIZATION_TOKEN
```

## 利点
- 無料プラン利用可能
- 高速なCDN
- 自動HTTPS
- カスタムドメイン対応

## 注意点
- サーバーレス環境のため、SSE接続に制限がある可能性
- コールドスタートがある

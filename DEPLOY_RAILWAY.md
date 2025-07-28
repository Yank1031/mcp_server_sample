# Employee MCP Server - Railway Deployment

## Railwayでのデプロイ手順

### 1. Railway CLIのインストール
```bash
npm install -g @railway/cli
```

### 2. ログインとプロジェクト作成
```bash
railway login
railway init
```

### 3. 環境変数設定
```bash
railway variables set AUTHORIZATION_TOKEN=your-secret-token
```

### 4. デプロイ
```bash
railway up
```

### 5. ドメイン設定
```bash
railway domain
```

## 利点
- 無料プラン $5/月クレジット
- 固定URL
- 簡単デプロイ
- PostgreSQLなど他サービスとの連携が容易

## 注意点
- 無料枠を超えると課金
- 比較的新しいサービス

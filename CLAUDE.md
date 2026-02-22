# GAEA MCP Server

Gaea 2.0 terrain generation tool の MCP サーバー。

## Development
```bash
npm run dev          # tsx でサーバー起動
npx tsc --noEmit     # 型チェック
```

## Structure
```
src/
  config.ts       - Gaea インストールパス自動検出
  node-types.ts   - ノードタイプレジストリ
  terrain-io.ts   - .terrain JSON 読み書き (カスタムシリアライザ)
  server.ts       - MCP サーバー + LLM向け instructions
```

## Key Design Decision
- LLM が知るべき制約 (ワークフロー、ノードカテゴリ、接続ルール等) は全て `server.ts` の `SERVER_INSTRUCTIONS` とツール description に記述。CLAUDE.md ではなくMCPプロトコル経由で伝達される。
- .terrain ファイルの $id 順序制約は `terrain-io.ts` の `serializeJson()` で自動処理。LLM 側の対応不要。

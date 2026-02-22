# GAEA MCP Server — 開発メモ

## 重要な技術的制約

- **$id 順序**: Gaea の .terrain (Newtonsoft.Json) は `$id` がオブジェクトの最初のプロパティであることを要求する。`terrain-io.ts` の `serializeJson()` で自動処理済み。`JSON.stringify` を直接使わないこと。
- **LLM向け情報**: ワークフロー、ノードカテゴリ、接続ルール等は `server.ts` の `SERVER_INSTRUCTIONS` とツール description に記述。CLAUDE.md ではなく MCP プロトコル経由で LLM に伝達される。
- **ノードレジストリ**: `node-types.ts` の定義は Gaea 2.0 Examples (59ファイル) のスキャンから生成。`scripts/scan-examples.ts` で再スキャン可能。

# gaea-mcp

[Gaea 2.0](https://quadspinner.com/) terrain generation tool の MCP サーバー。
CLI ビルド自動化と `.terrain` ファイルのグラフ操作を提供します。

## Setup

```bash
npm install
```

### MCP 設定

`.mcp.json` をプロジェクトルートに作成してください:

```json
{
  "mcpServers": {
    "gaea": {
      "command": "npx",
      "args": ["tsx", "src/server.ts"],
      "env": {
        "GAEA_INSTALL_DIR": "<path-to-gaea-install>",
        "PROJECT_DIR": "./projects",
        "OUTPUT_DIR": "./output"
      }
    }
  }
}
```

`GAEA_INSTALL_DIR` には Gaea 2.0 のインストールディレクトリを指定します。
省略した場合は `%LOCALAPPDATA%/Programs/Gaea 2.0` などの一般的なパスから自動検出を試みます。

## Tools

| Tool | Description |
|------|-------------|
| `check_gaea_status` | Gaea の検出状態とパスを確認 |
| `get_gaea_version` | インストール済み Gaea のバージョン取得 |
| `list_projects` | プロジェクトディレクトリの `.terrain` ファイル一覧 |
| `build_terrain` | Gaea.Swarm.exe で地形をビルド |
| `list_node_types` | 利用可能なノードタイプ一覧 |
| `read_terrain_graph` | `.terrain` ファイルのノード・接続サマリー |
| `get_node_details` | 特定ノードの詳細プロパティ |
| `add_node` | ノードを追加 |
| `remove_node` | ノードを削除 |
| `connect_nodes` | ノード間を接続 |
| `disconnect_port` | ポートの接続を解除 |
| `set_node_property` | ノードのプロパティを設定 |
| `create_terrain` | 空の `.terrain` ファイルを作成 |

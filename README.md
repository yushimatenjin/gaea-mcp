# gaea-mcp

[Gaea 2.0](https://quadspinner.com/) terrain generation tool の MCP サーバー。
CLI ビルド自動化と `.terrain` ファイルのグラフ操作を提供します。

## 前提条件

- **Node.js** v18 以上
- **Gaea 2.0** がインストール済みであること（Community / Professional）
  - ビルド機能には `Gaea.Swarm.exe` が必要です

## セットアップ

```bash
git clone <repo-url>
cd gaea-mcp
npm install
```

### 1. Gaea インストールパスの設定

サーバーは以下の優先順位で Gaea のインストール先を探します:

1. **環境変数 `GAEA_INSTALL_DIR`**（`.env` または `.mcp.json` で指定）
2. **自動検出** — `%LOCALAPPDATA%\Programs\Gaea 2.0` など一般的なパスを順に確認

> 通常のインストール（Gaea のデフォルトインストーラー）であれば自動検出されるため、明示的な設定は不要です。

カスタムパスにインストールした場合のみ、以下のいずれかで `GAEA_INSTALL_DIR` を設定してください。
指定するディレクトリには `Gaea.exe` と `Gaea.Swarm.exe` が含まれている必要があります。

### 2. 設定ファイルの作成

`.env` と `.mcp.json` はどちらも `.gitignore` に含まれており、リポジトリには同梱されません。
利用環境に合わせてローカルで作成してください。

#### 方法 A: `.env` ファイル（シンプル）

プロジェクトルートに `.env` を作成:

```env
# Gaea のインストールディレクトリ（自動検出できる場合は省略可）
# GAEA_INSTALL_DIR=C:/Users/<ユーザー名>/AppData/Local/Programs/Gaea 2.0

# .terrain ファイルの保存先（省略時: ./projects）
# PROJECT_DIR=./projects

# ビルド出力先（省略時: ./output）
# OUTPUT_DIR=./output
```

#### 方法 B: `.mcp.json`（Claude Code 連携用）

Claude Code から MCP サーバーとして利用する場合は `.mcp.json` を作成:

```json
{
  "mcpServers": {
    "gaea": {
      "command": "npx",
      "args": ["tsx", "src/server.ts"],
      "env": {
        "GAEA_INSTALL_DIR": "C:/Users/<ユーザー名>/AppData/Local/Programs/Gaea 2.0"
      }
    }
  }
}
```

**パスの書き方:**
- Windows でもスラッシュ `/` を使ってください（例: `C:/Users/...`）
- `<ユーザー名>` は自分の Windows ユーザー名に置き換えてください
- 自動検出に任せる場合は `GAEA_INSTALL_DIR` 行を削除して構いません

#### 環境変数一覧

| 変数名 | 必須 | デフォルト | 説明 |
|--------|------|-----------|------|
| `GAEA_INSTALL_DIR` | いいえ | 自動検出 | Gaea インストールディレクトリ |
| `PROJECT_DIR` | いいえ | `./projects` | `.terrain` ファイルの保存ディレクトリ |
| `OUTPUT_DIR` | いいえ | `./output` | ビルド出力ディレクトリ |

### 3. 動作確認

```bash
# サーバーの起動テスト（stdio で起動し、Gaea 検出ログが stderr に出る）
npm run dev

# 正常なら以下のようなログが出力される:
# [config] Auto-detected Gaea install at: C:/Users/.../AppData/Local/Programs/Gaea 2.0
# [gaea-mcp-server] Server started on stdio transport
```

Ctrl+C で終了してください。このサーバーは MCP クライアント（Claude Code 等）経由で使うものなので、
通常は直接起動する必要はありません。

## 使い方

### Claude Code から使う

1. 上記の `.mcp.json` をプロジェクトルートに配置
2. Claude Code のプロジェクトディレクトリでこのリポジトリを開く
3. Claude に「地形を作って」と言えば、MCP ツール経由でノードグラフの作成・ビルドが可能

### 典型的なワークフロー

```
create_terrain → add_node (Mountain) → add_node (Erosion2) → connect_nodes → build_terrain
```

## Tools

| Tool | Description |
|------|-------------|
| `check_gaea_status` | Gaea の検出状態とパスを確認 |
| `get_gaea_version` | インストール済み Gaea のバージョン取得 |
| `list_projects` | プロジェクトディレクトリの `.terrain` ファイル一覧 |
| `build_terrain` | Gaea.Swarm.exe で地形をビルド |
| `list_node_types` | 利用可能なノードタイプ一覧（120種、9カテゴリ） |
| `read_terrain_graph` | `.terrain` ファイルのノード・接続サマリー |
| `get_node_details` | 特定ノードの詳細プロパティ |
| `create_terrain` | 空の `.terrain` ファイルを作成 |
| `add_node` | ノードを追加 |
| `remove_node` | ノードを削除 |
| `connect_nodes` | ノード間を接続 |
| `disconnect_port` | ポートの接続を解除 |
| `set_node_property` | ノードのプロパティを設定 |

## 開発

```bash
npm run dev          # tsx でサーバー起動（開発用）
npx tsc --noEmit     # 型チェック
npm run build        # dist/ にコンパイル
```

### ディレクトリ構成

```
src/
  config.ts       - Gaea インストールパス自動検出
  node-types.ts   - ノードタイプレジストリ（120種）
  terrain-io.ts   - .terrain JSON 読み書き（カスタムシリアライザ）
  server.ts       - MCP サーバー + LLM向け instructions
scripts/
  scan-examples.ts - Gaea Examples からノードタイプを抽出するスクリプト
```

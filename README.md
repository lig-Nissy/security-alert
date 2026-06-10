# Security Alert

外部スクリプトと npm パッケージのサプライチェーン脆弱性を、貼り付けたコードからその場で診断する Next.js アプリです。

## 背景

polyfill.io 事件 (2024) のように、外部から読み込んでいるスクリプトや、依存している npm パッケージそのものに悪意あるコードが混入する **サプライチェーン攻撃** が継続的に発生しています。本アプリは、コードを貼り付けるだけでそうしたリスクを 2 つの軸からチェックします。

## 機能

### 1. 外部スクリプト スキャナ — `/scan`

HTML / JS を貼り付けると、`<script src>` と動的 `import()` を抽出し、以下を検出します。

| 検出項目 | severity | 説明 |
| --- | --- | --- |
| 侵害履歴のあるドメイン参照 | critical | polyfill.io / cdn.polyfill.io / bootcss.com 系列など、過去にサプライチェーン攻撃が確認されたドメイン |
| SRI (Subresource Integrity) 欠落 | high | `integrity` 属性が無く、CDN 側で差し替えられても検知できない |
| バージョン非固定 | medium | `latest` / `^1.2` / 数値メジャーなど、CDN 側で実体が変わり得る指定 |
| 主要 CDN 以外からの読み込み | medium | cdnjs / jsdelivr / unpkg 等のホワイトリスト外ドメイン |

データソース: ローカル定義 (`src/features/script_scanner/data/`)

### 2. パッケージ スキャナ — `/scan/packages`

`package.json` / `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml` の中身を貼り付けると、ファイル種別を自動判別してパッケージを抽出し、以下を照会します。

- **OSV.dev** (Google) のバッチ API で既知の CVE / GHSA を取得
- ローカル定義の **侵害履歴パッケージ一覧** と照合 (event-stream, ua-parser-js, node-ipc, coa, rc 等)

severity は CVSS と DB ラベルから推定し、critical / high / medium / low / unknown で表示します。

## 画面構成

- `/` — トップ。両スキャナへの導線
- `/scan` — スクリプトスキャナ
- `/scan/packages` — パッケージスキャナ
- `/api/osv` — OSV.dev 照会用の内部 Route Handler (POST)

## ディレクトリ構成

```
src/
├── app/                          # ルーティング専用 (Next.js App Router)
│   ├── page.tsx                  # トップ
│   ├── scan/page.tsx             # スクリプトスキャナ
│   ├── scan/packages/page.tsx    # パッケージスキャナ
│   └── api/osv/route.ts          # OSV.dev 照会 API
├── features/
│   ├── script_scanner/           # スクリプトスキャナ機能
│   │   ├── components/  data/  pages/  types/  utils/
│   └── package_scanner/          # パッケージスキャナ機能
│       ├── components/  data/  pages/  types/  utils/
├── components/                   # 横断的なUIコンポーネント (BackLink等)
├── hooks/  providers/  utils/  lib/  constants/  types/  styles/  tests/
```

参考: [Next.js App Router のディレクトリ構成](https://techblog.technology-doctor.com/entry/2024/09/12/172551) (snake_case / features ベース)

## 技術スタック

- **Next.js 16** (App Router, Turbopack) / **React 19**
- **TypeScript** (strict)
- **Tailwind CSS v4**
- **Biome** (lint + format, 4-space indent)
- **Husky + lint-staged** (pre-commit で Biome 自動実行)
- **OSV.dev REST API** (パッケージ脆弱性照会)

## セットアップ

```bash
npm install
npm run dev
# http://localhost:3001 を開く (next dev --port 3001)
```

## スクリプト

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバ起動 (port 3001) |
| `npm run build` | プロダクションビルド + フォーマットチェック |
| `npm run start` | プロダクション起動 |
| `npm run check` | Biome lint + format + auto fix |
| `npm run check:ci` | Biome lint + format チェックのみ (CI 用) |
| `npm run format` | Biome フォーマット適用 |
| `npm run lint` | ESLint |

## CI

`.github/workflows/build.yml` で `main` / `staging` 向け Pull Request 時に以下を実行します。

1. `npm ci`
2. `npm run build`

## データソースと制限

- OSV.dev は API キー不要・無料の公開 API ですが、レートリミットが存在します。大量パッケージを連続スキャンする場合は注意してください。
- バージョンが完全指定 (例: `1.2.3`) のもののみが OSV 照会対象になります。`^1.0.0` のような範囲指定は除外されます (lockfile を推奨)。
- 侵害履歴のドメイン / パッケージはローカル定義のため、最新の脅威に追従するには `src/features/*/data/` を更新する必要があります。

## ライセンス

社内利用想定。

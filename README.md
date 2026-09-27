# Melodee

Melodeeは、手元の動画を整理して再生するためのローカル動画プレイヤーです。macOS、Windows、iOSとWebで利用でき、ライブラリ・フォルダ・プレイリスト・お気に入り・再生位置・字幕を端末内で管理します。アカウントやクラウドへのアップロードは必要ありません。

## 開発

Node.js 20以降を使用します。

```sh
npm ci
npm run dev          # http://127.0.0.1:5173
npm run desktop:dev  # Electronを開発モードで起動
```

## ビルドと配布

```sh
npm run build
npm run package:mac
npm run package:win
npm run ios:sync
```

macOSとWindowsの配布物は`release/`に出力されます。iOSのIPAを作成する場合は`npm run package:ios`を実行してください。

macOS向けの公開DMGはDeveloper IDで署名し、Appleの公証を通過させる必要があります。未署名のローカルビルドは配布用ではありません。

自分のMacでのみ使う未署名の`.app`は、`npm run package:mac:local`で`release/mac-arm64/Melodee.app`へ生成できます。

## Vercel

VercelではトップページをMelodeeの配布サイトとして公開し、`/app`でWebプレイヤーを提供します。ビルド時にAltStoreソースも生成されます。

1. Vercelプロジェクト名を`melodee`に変更します。
2. Production環境変数`VITE_SITE_ORIGIN`に公開URL（例: `https://melodee.vercel.app`）を設定します。
3. `main`へのデプロイ後、`/`、`/app`、`/altstore.json`を確認します。

`VITE_SITE_ORIGIN`を設定しない場合は、標準の`https://melodee.vercel.app`をAltStoreと公開メタデータの基準URLとして使用します。

### macOSの署名・公証

GitHub ReleasesでmacOS版を公開する前に、リポジトリのActions secretsへ次を設定してください。設定がない場合、リリースビルドは失敗し、未署名DMGは公開されません。

- `MAC_CSC_LINK`: Developer ID Application証明書（`.p12`）をBase64化した値
- `MAC_CSC_KEY_PASSWORD`: `.p12`のパスワード
- `APPLE_ID`: 公証に使用するApple ID
- `APPLE_APP_SPECIFIC_PASSWORD`: Apple IDのApp用パスワード
- `APPLE_TEAM_ID`: Apple Developer Team ID

## テスト

```sh
npm test
npm run test:browser
npm run test:desktop
```

# yoshi

## 説明

Puppeteerを使ってChrome DeveloperToolのネットワークパネル統計情報の近似値を取得するツールです

```
$ node yoshi.js -u https://yumenosora.co.jp/tora-lab
142 requests
3.50 MB transferred
4.83 MB resources
Finish: 10.139 sec
```

```
$ node yoshi.js -u https://www.google.com/intl/ja_jp/chrome/
22 requests
0.15 MB transferred
0.63 MB resources
Finish: 4.286 sec
```

## インストール

```
npm install
```

## HELP

```
Usage: yoshi [options]

Options:
  -u, --url <target-url>     url
  -f, --full-screen-capture  capture image full-screen (default=first view)  [optional]
  -m, --mobile               device mode = smart phone [optional]
  -s, --slack                send slack message [optional]
  -h, --help                 output usage information
```


## 設定

slack通知機能を使う場合は.envファイルを作成し以下の設定をしてください

```
NP_SLACK_URL=https://hooks.slack.com/services/------
#画像ファイルを上げる時は下記も必要
NP_SLACK_TOKEN=
NP_CHANNEL=
```
/**
 * PM2 設定ファイル
 * Next.js アプリケーションを本番環境で稼働するための設定
 * 
 * 使用方法:
 *   開発環境: pm2 start ecosystem.config.js --env development
 *   本番環境: pm2 start ecosystem.config.js --env production
 * 
 * PM2 コマンド:
 *   起動: pm2 start ecosystem.config.js
 *   停止: pm2 stop next-todo
 *   再起動: pm2 restart next-todo
 *   削除: pm2 delete next-todo
 *   ログ確認: pm2 logs next-todo
 *   ステータス確認: pm2 status
 *   モニタリング: pm2 monit
 */
module.exports = {
  apps: [
    {
      // アプリケーション名
      name: 'next-todo',
      
      // Next.js サーバーの起動スクリプト
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      
      // 実行ディレクトリ
      cwd: './',
      
      // インスタンス数（CPUコア数に応じて自動調整）
      instances: 'max',
      
      // クラスターモードで実行（負荷分散）
      exec_mode: 'cluster',
      
      // ウォッチモード（本番環境では無効）
      watch: false,
      
      // 最大メモリ制限（超過時に自動再起動）
      max_memory_restart: '1G',
      
      // 環境変数ファイルのパス
      env_file: '.env',
      
      // 環境変数
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // エラーログファイル
      error_file: './logs/pm2-error.log',
      
      // 出力ログファイル
      out_file: './logs/pm2-out.log',
      
      // ログの日時フォーマット
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      
      // ログをマージ（複数インスタンスのログを1つに）
      merge_logs: true,
      
      // 自動再起動の設定
      autorestart: true,
      
      // クラッシュ時の再起動試行回数
      max_restarts: 10,
      
      // 再起動の最小稼働時間（これ以下の場合は異常終了とみなす）
      min_uptime: '10s',
      
      // 再起動の遅延時間
      restart_delay: 4000,
      
      // リスンタイムアウト（起動完了とみなすまでの時間）
      listen_timeout: 10000,
      
      // Killタイムアウト（強制終了までの待機時間）
      kill_timeout: 5000,
      
      // 待機待ち準備完了シグナル
      wait_ready: false,
      
      // Graceful Shutdown
      shutdown_with_message: false,
    },
  ],

  /**
   * デプロイ設定（オプション）
   * SSH経由でのデプロイを行う場合に使用
   */
  deploy: {
    production: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/main',
      repo: 'GIT_REPOSITORY',
      path: 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};

module.exports = {
    apps: [
        {
            name: 'garpunScript5',
            script: './srs/app.js',
            watch: false,
            ignore_watch: ['[/\\]./', 'node_modules', 'logs', 'dataBase'],
            max_memory_restart: '250M',
            error_file: './logs/pm2-err.log',
            out_file: './logs/pm2-out.log',
            log_file: './logs/pm2-combined.log',
            time: true,
            env: {
                NODE_ENV: 'DEV',
                SQL_DB: 'test_garpun.db',
            },
            env_production: {
                NODE_ENV: 'PROD',
            },
        },
    ],
};

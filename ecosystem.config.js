module.exports = {
	apps: [
		{
			name: 'booking-pms',
			script: 'server.js',
			cwd: '/var/www/booking-pma',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '256M',
			env: {
				NODE_ENV: 'production',
				PORT: 3721,
			},
		},
	],
};

# Shotgun API Javascript Client and CLI

## Installation
```sh
npm install shotgun-nodejs
```

## Getting Started

### Using as a CLI (interactive)

```sh
# One time global installation
npm install -g shotgun-nodejs
# Interactive mode
shotgun-nodejs
```

### Using as a CLI (non-interactive)

```sh
# One time global installation
npm install -g shotgun-nodejs

shotgun-nodejs --site https://mysite.shotgunstudio.com --username username --password password entity-read HumanUser 3

# Credentials setup alternative
export SHOTGUN_SITE=https://mysite.shotgunstudio.com
export SHOTGUN_USERNAME=username
export SHOTGUN_PASSWORD=password

shotgun-nodejs entity-read HumanUser 3
```

### Using as a library
```javascript
const { ShotgunApiClient } = require('shotgun-nodejs');

(async function() {
	let shotgun = new ShotgunApiClient({
		siteUrl: 'https://mysite.shotgunstudio.com',
		credentials: {
			grant_type: 'password',
			username: 'username',
			password: 'password',
		}
	});

	let out = await shotgun.entityRead({
		entity: 'HumanUsers',
		entityId: 3,
	});
	console.log(out);
})();
```

To view available list of commands

## For Contributors

### Project structure

```
shotgun-nodejs
├── cli
│    ├── commands           CLI command definitions
│    └── interactive
│        └── operations     CLI interactive choice definitions
└── src
     └── client.js          Main module
```

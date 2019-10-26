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

# Command invocation
shotgun-nodejs --site https://mysite.shotgunstudio.com --username username --password password entity-read HumanUser 3

# Credentials setup alternative
export SHOTGUN_SITE=https://mysite.shotgunstudio.com
export SHOTGUN_USERNAME=username
export SHOTGUN_PASSWORD=password

shotgun-nodejs entity-read HumanUser 3
```

To view a list of available commands, refer to `shotgun-nodejs --help`.

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

### Authentication through other methods

You may authenticate using other methods when using as a library by inputting
a different type of credentials object to the constructor object as follows:

```javascript
// Password-based
{
	grant_type: 'password',
	username: 'username',
	password: 'password',
	scope: 'sudo_as_login:username', // optional
	session_uuid: 'sess_12345',      // optional
}

// Client-based
{
	grant_type: 'client_credentials',
	client_id: 'id',
	client_secret: 'secret',
	scope: 'sudo_as_login:username', // optional
	session_uuid: 'sess_12345',      // optional
}

// Session token-based
{
	grant_type: 'session_token',
	session_token: 'token',
}

// Refresh token-based
{
	grant_type: 'refresh_token',
	refresh_token: 'token',
}
```

Different authentication mode for CLI is not available at the moment.

## Missing Support

Currently not able to perform the following:

- Entity record revive
- Entity follow-related
- Entity relationship-related support
- Hierarchy data-related access
- Preferences-related access
- Webhooks-related access
- Schedule-related access

You may use the `raw request` command/operation to perform them in the meantime.

## Project Structure

Important files at a glance.

```
shotgun-nodejs
├── cli
│    ├── commands           CLI command definitions
│    └── interactive
│        └── operations     CLI interactive choice definitions
└── src
     └── client.js          Main module
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/shotgunsoftware/shotgun-nodejs.

## License

The library and executable are available as open source under the terms of the MIT License.

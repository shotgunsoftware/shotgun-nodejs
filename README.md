# Shotgrid API Javascript Client

## Installation
```sh
npm install shotgun-nodejs
```

## Getting Started

### Using with CLI

A companion CLI can be found at https://github.com/shotgunsoftware/shotgrid-nodejs-cli

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

You may authenticate using other methods by inputting
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

## Missing Support

Currently not able to perform the following:

- Entity follow-related support
- Entity relationship-related support
- Hierarchy data-related access
- Webhooks-related access
- Schedule-related access

You may use the `raw request` command/operation to perform them in the meantime.

## Project Structure

Important files at a glance.

```
shotgun-nodejs
└── src
     └── client.js          Main module
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/shotgunsoftware/shotgun-nodejs.

## License

The library and executable are available as open source under the terms of the MIT License.

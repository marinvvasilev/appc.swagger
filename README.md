# Swagger Connector

This is a Arrow connector to any Swagger defined API.

## Installation

Just enter the following command in your arrow project root to install the
Swagger connector.

```bash
appc install connector/appc.swagger
```

## Usage

You will need to customize the configuration file generated for you to include
at least a "swaggerDocs" key such as:

```js
module.exports = {
  connectors: {
    'appc.swagger': {
      // The URL to the main api-docs for your Swagger API.
      swaggerDocs: 'http://petstore.swagger.io/v2/swagger.json',
      // ...
    }
  }
};
```

If the swagger definition is protected against unauthorized access with either
http basic or api key authentication you can configure those under the `login`
key.

Should your API itself require authentication, you can create a mapping of
swagger security definitions to authentication providers under the
`authenticationProvider` key. A mapping consists of the key for the swagger
security definition and the config for the matching authentication provider.
Supported authentication types include http basic, api key, cookie and Oauth2
(password and client credentials grant).

Please refer to the generated configuration file of this connector for usage
examples for each mentioned authentication type above.

## Development

> This section is for individuals developing the Swagger Connector and not intended
  for end-users.

```bash
npm install
node app.js
```

### Running Unit Tests

```bash
npm test
```

## Contributing

Please see our [CONTRIBUTING.md](./CONTRIBUTING.md)

## Legal Stuff

Appcelerator is a registered trademark of Appcelerator, Inc. Arrow and associated marks are trademarks of Appcelerator. All other marks are intellectual property of their respective owners. Please see the LEGAL information about using our trademarks, privacy policy, terms of usage and other legal information at [http://www.appcelerator.com/legal](http://www.appcelerator.com/legal).

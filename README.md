## Using web-ext with Firefox addons

`web-ext build`

This outputs a full path to the generated .zip file that can be loaded into a browser.

`web-ext sign --api-key=$AMO_JWT_ISSUER --api-secret=$AMO_JWT_SECRET`

The API options are required to specify your addons.mozilla.org credentials.

    `--api-key`: the API key (JWT issuer) from addons.mozilla.org needed to sign the extension. This is a string that will look something like `user:12345:67`.
    `--api-secret`: the API secret (JWT secret) from addons.mozilla.org needed to sign the extension. This is a string that will look something like `634f34bee43611d2f3c0fd8c06220ac780cff681a578092001183ab62c04e009`.

For API keys, see: http://addons-server.readthedocs.org/en/latest/topics/api/auth.html#create-a-jwt-for-each-request/

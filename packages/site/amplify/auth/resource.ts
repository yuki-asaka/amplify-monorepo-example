import {defineAuth, secret} from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true, externalProviders: {
      oidc: [{
        clientId: secret('OidcClientId'),
        clientSecret: secret('OidcClientSecret'),
        issuerUrl: process.env.OIDC_ISSUER_URL!,
        endpoints: {
          authorization: process.env.OIDC_AUTHORIZATION!,
          token: process.env.OIDC_TOKEN!,
          userInfo: process.env.OIDC_USERINFO!,
          jwksUri: process.env.OIDC_JWKS_URI!,
        }
      }],
      callbackUrls: ['https://example.com'],
      logoutUrls: ['https://example.com']
    }
  }
});

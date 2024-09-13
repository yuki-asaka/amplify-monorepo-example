import {defineAuth, secret} from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true, externalProviders: {
      oidc: [{
        clientId: secret('OidcClientId'),
        clientSecret: secret('OidcClientSecret'),
        issuerUrl: 'https://example.com',
      }],
      callbackUrls: ['https://example.com'],
      logoutUrls: ['https://example.com']
    }
  }
});

import {defineAuth, secret} from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true, externalProviders: {
      oidc: [{
        clientId: secret('foo'), clientSecret: secret('bar'), issuerUrl: 'https://example.com',
      }], callbackUrls: ['https://example.com'], logoutUrls: ['https://example.com']
    }
  }
});

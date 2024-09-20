import {defineAuth, secret} from '@aws-amplify/backend';
import {preAuthTrigger} from "../functions/pre-auth-trigger/resource";

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      oidc: [{
        clientId: secret('OidcClientId'),
        clientSecret: secret('OidcClientSecret'),
        name: process.env.OIDC_NAME!,
        issuerUrl: process.env.OIDC_ISSUER_URL!,
        scopes: ['OPENID', 'EMAIL', 'PROFILE'],
        endpoints: {
          authorization: process.env.OIDC_AUTHORIZATION!,
          token: process.env.OIDC_TOKEN!,
          userInfo: process.env.OIDC_USERINFO!,
          jwksUri: process.env.OIDC_JWKS_URI!,
        }
      }],
      callbackUrls: ['http://localhost:3000'],
      logoutUrls: ['http://localhost:3000']
    }
  },
  triggers: {
    preSignUp: preAuthTrigger,
    preAuthentication: preAuthTrigger
  }
});

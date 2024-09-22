import {defineAuth, secret} from '@aws-amplify/backend';
import {preAuthTrigger} from "../functions/pre-auth-trigger/resource";

const callbacks = [
  'http://localhost:3000',
];
if (process.env.HOSTED_ZONE_NAME && process.env.DOMAIN_NAME) {
  callbacks.push(`https://${process.env.DOMAIN_NAME}.${process.env.HOSTED_ZONE_NAME}`);
}

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      oidc: [{
        clientId: secret('OidcClientId'),
        clientSecret: secret('OidcClientSecret'),
        name: process.env.OIDC_NAME!,
        issuerUrl: process.env.OIDC_ISSUER_URL!,
        scopes: ['openid', 'email', 'profile'],
        endpoints: {
          authorization: process.env.OIDC_AUTHORIZATION!,
          token: process.env.OIDC_TOKEN!,
          userInfo: process.env.OIDC_USERINFO!,
          jwksUri: process.env.OIDC_JWKS_URI!,
        }
      }],
      callbackUrls: callbacks,
      logoutUrls: callbacks
    }
  },
  triggers: {
    preSignUp: preAuthTrigger,
    preAuthentication: preAuthTrigger
  }
});

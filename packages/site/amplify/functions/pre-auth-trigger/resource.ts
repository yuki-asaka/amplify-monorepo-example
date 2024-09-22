import {defineFunction, secret} from '@aws-amplify/backend';

export const preAuthTrigger = defineFunction({
  name: 'pre-auth-trigger',
  entry: './handler.ts',
  environment: {
    APP_ID: process.env.GITHUB_APP_ID as string,
    INSTALL_ID: process.env.GITHUB_INSTALL_ID as string,
    ORG_NAME: process.env.GITHUB_ORG_NAME as string,
    APP_SECRET: secret('GITHUB_APP_SECRET'),
  }
});

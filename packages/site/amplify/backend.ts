import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import {
  aws_cognito as cognito,
} from 'aws-cdk-lib';
import * as constructs from '../lib/constructs';

const backend = defineBackend({
  auth,
  data,
});

const authStack = backend.createStack('AuthStack');

const appName = process.env.APP_NAME as string;
const userPool = backend.auth.resources.userPool as cognito.UserPool;
const userPoolClient = backend.auth.resources.userPoolClient as cognito.UserPoolClient;

// const githubAppId = process.env.GITHUB_APP_ID as string;
// const githubInstallId = process.env.GITHUB_INSTALL_ID as string;
// const githubOrgName = process.env.GITHUB_ORG_NAME as string;

new constructs.SiteAdapter(authStack, 'SiteAdapter', {
  appName,
  userPool,
  userPoolClient,
})
// .withGithubAuthRestriction(
//   githubAppId,
//   githubInstallId,
//   githubOrgName
// );

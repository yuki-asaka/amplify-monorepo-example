import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import {preAuthTrigger} from "./functions/pre-auth-trigger/resource";
import {
  aws_cognito as cognito,
} from 'aws-cdk-lib';
import * as constructs from '../lib/constructs';

const backend = defineBackend({
  auth,
  data,
  preAuthTrigger
});

const authStack = backend.createStack('AuthStack');

const appName = process.env.APP_NAME as string;
const userPool = backend.auth.resources.userPool as cognito.UserPool;
const userPoolClient = backend.auth.resources.userPoolClient as cognito.UserPoolClient;

new constructs.SiteAdapter(authStack, 'SiteAdapter', {
  appName,
  userPool,
  userPoolClient,
})

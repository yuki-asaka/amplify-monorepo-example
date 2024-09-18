import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import {
  aws_cognito as cognito,
  aws_ssm as ssm,
} from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
});

if (process.env.APP_NAME === undefined) {
  throw new Error('APP_NAME is not defined');
}

const appName = process.env.APP_NAME;
const userPool = backend.auth.resources.userPool as cognito.UserPool;
const userPoolClient = backend.auth.resources.userPoolClient as cognito.UserPoolClient;

userPool.addDomain('CognitoDomain', {cognitoDomain: {domainPrefix: appName}});

const stack = backend.createStack('SiteParameters');
new ssm.StringParameter(stack, 'user-pool-id', {
  parameterName: `/${appName}/user-pool-id`, stringValue: userPool.userPoolId,
});

new ssm.StringParameter(stack, 'user-pool-domain-prefix', {
  parameterName: `/${appName}/user-pool-domain`, stringValue: appName,
});

const cognitoClientParamName = `/${appName}/user-pool-client-id`;
new ssm.StringParameter(stack, 'user-pool-client-id', {
  parameterName: cognitoClientParamName, stringValue: userPoolClient.userPoolClientId,
});

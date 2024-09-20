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

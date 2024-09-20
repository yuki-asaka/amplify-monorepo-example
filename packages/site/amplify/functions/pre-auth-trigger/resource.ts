import { defineFunction } from '@aws-amplify/backend';

export const preAuthTrigger = defineFunction({
  name: 'pre-auth-trigger',
  entry: './handler.ts'
});

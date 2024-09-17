import { defineBackend } from '@aws-amplify/backend';
import * as constructs from '../lib/constructs';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({});

const infraStack = backend.createStack('SiteInfra');

new constructs.SiteCdn(infraStack, 'SiteCdn', {
    appName: 'site-cdn'
})
.withLambdaProtection()
.withCDN()
.withGithubWrapper()
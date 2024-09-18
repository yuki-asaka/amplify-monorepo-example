import { defineBackend } from '@aws-amplify/backend';
import * as constructs from '../lib/constructs';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({});

const infraStack = backend.createStack('SiteInfra');

// domain
const hostedZoneId = process.env.HOSTED_ZONE_ID;
const hostedZoneName = process.env.HOSTED_ZONE_NAME;
const domainName = process.env.DOMAIN_NAME;

new constructs.SiteCdn(infraStack, 'SiteCdn', {
    appName: 'site-cdn'
})
.withCustomDomain(hostedZoneId!, hostedZoneName!, domainName!)
.withLambdaProtection()
.withCDN()
.withGithubWrapper()

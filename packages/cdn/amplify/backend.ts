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

const siteCdn = new constructs.SiteCdn(infraStack, 'SiteCdn', {
    appName: 'site-cdn'
})
    .withCustomDomain(hostedZoneId!, hostedZoneName!, domainName!)
    .withLambdaProtection('ap-northeast-1')
    .withCDN()
    .withGithubWrapper();

siteCdn.connectWebPipeline(process.env.CODE_CONNECTIONS_ARN!,
    {
        branch: process.env.REPO_BRANCH!,
        name: process.env.REPO_NAME!,
        owner: process.env.REPO_OWNER!,
    },
    process.env.REPO_PATH
);

import { defineBackend } from '@aws-amplify/backend';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({});

const infraStack = backend.createStack('SiteInfra');

new s3.Bucket(infraStack, 'SiteBucket', {
    removalPolicy: RemovalPolicy.DESTROY,
});

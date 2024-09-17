import { Construct } from 'constructs';
import { Stack, RemovalPolicy } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class SiteCdn extends Construct {
    private readonly _appName: string;
    private readonly _accessLogBucket: s3.IBucket;
    private readonly _frontendS3Bucket: s3.IBucket;

    constructor(scope: Construct, id: string, props: {
        appName: string,
    }) {
        super(scope, id);

        this._appName = props.appName;

        const stack = Stack.of(this);

        this._accessLogBucket = new s3.Bucket(this, 'AccessLogBucket', {
            accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
            bucketName: `${this._appName}-${stack.region}-${stack.account}-logs`,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            serverAccessLogsPrefix: 'access-log-bucket/',
            removalPolicy: RemovalPolicy.DESTROY,
        })

        /* S3 bucket for react app CDN */
        this._frontendS3Bucket = new s3.Bucket(this, 'FrontendBucket', {
            accessControl: s3.BucketAccessControl.PRIVATE,
            bucketName: `${this._appName}-${stack.region}-${stack.account}`,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            autoDeleteObjects: true,
            serverAccessLogsBucket: this._accessLogBucket,
            serverAccessLogsPrefix: 'frontend-bucket/',
            removalPolicy: RemovalPolicy.DESTROY,
        });
    }
}
import { Construct } from 'constructs';
import { Stack, RemovalPolicy, Duration } from 'aws-cdk-lib';
import {
    aws_s3 as s3,
    aws_lambda as lambda,
    aws_lambda_nodejs as lambdaNode,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_certificatemanager as acm,
    aws_iam as iam,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_wafv2 as wafv2,
} from 'aws-cdk-lib';
import * as fs from "node:fs";


enum HttpStatus {
    OK = 200, Unauthorized = 403, NotFound = 404
}

export class SiteCdn extends Construct {
    private readonly _appName: string;
    private readonly _accessLogBucket: s3.IBucket;
    private readonly _frontendS3Bucket: s3.IBucket;
    private _lambdaAtEdge: lambdaNode.NodejsFunction | undefined;
    private _distribution: cloudfront.Distribution | undefined;
    private _wafACL: wafv2.CfnWebACL | undefined;
    private _domainName: string | undefined;
    private _hostedZone: route53.IHostedZone | undefined;
    private _certificate: acm.Certificate | undefined;

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

    withLambdaProtection(parameterRegion?: string): SiteCdn {
        const jsonIndentSpaces = 4;
        fs.writeFileSync('./lib/server/site-cdn/src/auth-handler.config.json', JSON.stringify({
            AppName: this._appName,
            Region: parameterRegion ?? 'us-east-1',
        }, null, jsonIndentSpaces));

        this._lambdaAtEdge = new lambdaNode.NodejsFunction(this, 'AuthHandler', {
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: './lib/server/site-cdn/src/auth-handler.ts',
            bundling: {
                externalModules: [
                    '@aws-sdk/*',
                    'hono',
                    'hono/secure-headers',
                    'hono/logger',
                    'hono/lambda-edge',
                ],
            },
        });
        this._lambdaAtEdge.applyRemovalPolicy(RemovalPolicy.DESTROY);

        const stack = Stack.of(this);
        const arnSuffix = `arn:aws:ssm:${parameterRegion}:${stack.account}:parameter/${this._appName}`;
        const statement = new iam.PolicyStatement({
            actions: ['ssm:GetParameter'],
            resources: [
                `${arnSuffix}/user-pool-id`,
                `${arnSuffix}/user-pool-client-id`,
                `${arnSuffix}/user-pool-domain`,
            ]
        });
        this._lambdaAtEdge.addToRolePolicy(statement);
                return this;
    }

    withCDN(): SiteCdn {
        const defaultErrorResponseTTLSeconds = 10;
        this._distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessIdentity(this._frontendS3Bucket),
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                compress: false,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS,
                edgeLambdas: [{
                    eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                    functionVersion: this._lambdaAtEdge!.currentVersion
                }]
            },
            httpVersion: cloudfront.HttpVersion.HTTP1_1,
            enableIpv6: false,
            defaultRootObject: '/index.html',
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            errorResponses: [{
                httpStatus: HttpStatus.NotFound,
                responseHttpStatus: HttpStatus.OK,
                responsePagePath: '/index.html',
                ttl: Duration.seconds(defaultErrorResponseTTLSeconds)
            }, {
                httpStatus: HttpStatus.Unauthorized,
                responseHttpStatus: HttpStatus.OK,
                responsePagePath: '/index.html',
                ttl: Duration.seconds(defaultErrorResponseTTLSeconds)
            }],
            webAclId: this._wafACL?.attrArn,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            logBucket: this._accessLogBucket,
            logFilePrefix: 'frontend-distribution/',
            certificate: this._certificate,
        });

        if (this._domainName && this._hostedZone) {
            new route53.ARecord(this, 'AliasRecord', {
                zone: this._hostedZone,
                target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(this._distribution)),
                recordName: this._domainName,
            });
        }

        return this;
    }

    withGithubWrapper(
    ): SiteCdn {
        const jsonIndentSpaces = 4;
        fs.writeFileSync('./lib/server/site-cdn/src/oauth-access-token.config.json', JSON.stringify({
            AppName: this._appName,
        }, null, jsonIndentSpaces));

        const accessTokenLambda = new lambdaNode.NodejsFunction(this, 'OauthAccessToken', {
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: './lib/server/site-cdn/src/oauth-access-token.ts',
            handler: 'handler',
            bundling: {
                externalModules: [
                    '@aws-sdk/*',
                ],
            },
        });
        accessTokenLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

        fs.writeFileSync('./lib/server/site-cdn/src/oauth-user.config.json', JSON.stringify({
            AppName: this._appName,
        }, null, jsonIndentSpaces));

        const userLambda = new lambdaNode.NodejsFunction(this, 'OauthUser', {
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: './lib/server/site-cdn/src/oauth-user.ts',
            handler: 'handler',
            bundling: {
                externalModules: [
                    '@aws-sdk/*',
                ],
            },
        });
        userLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

        const origin = origins.S3BucketOrigin.withOriginAccessIdentity(this._frontendS3Bucket);
        // receive post data
        this._distribution?.addBehavior(
            '/oauth/access_token',
            origin,
            {
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                edgeLambdas: [{
                    eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                    functionVersion: accessTokenLambda.currentVersion,
                    includeBody: true,
                }]
            }
        );

        this._distribution?.addBehavior(
            '/oauth/user',
            origin,
            {
                edgeLambdas: [{
                    eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                    functionVersion: userLambda.currentVersion,
                }]
            }
        );

        return this;
    }

    withCustomDomain(hostedZoneId: string, hostedZoneName: string, domainName: string): SiteCdn {
        if (!hostedZoneId) {
            throw new Error('HostedZoneId is required');
        }
        if (!hostedZoneName) {
            throw new Error('HostedZoneName is required');
        }
        if (!domainName) {
            throw new Error('DomainName is required');
        }
        this._domainName = domainName;
        this._hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
            hostedZoneId,
            zoneName: hostedZoneName,
        });

        // https://github.com/aws/aws-cdk/issues/25343
        this._certificate = new acm.DnsValidatedCertificate(this, 'Certificate', {
            domainName: `${domainName}.${hostedZoneName}`,
            hostedZone: this._hostedZone,
            region: 'us-east-1',
        });
        return this;
    }
}
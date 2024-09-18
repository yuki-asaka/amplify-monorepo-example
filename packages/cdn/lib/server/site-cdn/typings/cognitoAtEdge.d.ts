declare module 'cognito-at-edge' {
    import { CloudFrontRequestEvent, CloudFrontRequestResult } from 'aws-lambda';

    type AuthenticatorParams = {
        region: string,
        userPoolId: string,
        userPoolAppId: string,
        userPoolDomain: string,
        cookieExpirationDays?: number,
        logLevel?: AuthenticatorLogLevel,
    };

    export type AuthenticatorLogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

    export class Authenticator {
        constructor(params: AuthenticatorParams);

        handle(event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult>;
    }
}

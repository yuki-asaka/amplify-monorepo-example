import { CloudFrontRequestEvent, CloudFrontRequestHandler } from 'aws-lambda';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import config from './auth-handler.config.json';
import { AsyncHandler } from './helpers/async-handler';

const defaultRegion = config.Region;
const ssmParamNames = {
    userPoolIdParamName: `/${config.AppName}/user-pool-id`,
    userPoolClientIdParamName: `/${config.AppName}/user-pool-client-id`,
    userPoolDomainParamName: `/${config.AppName}/user-pool-domain`
};
const ssmClient = new SSMClient({ region: defaultRegion });

export const handler: CloudFrontRequestHandler =
    async (event: CloudFrontRequestEvent) => AsyncHandler.handleAsync(
        event,
        {
            region: defaultRegion,
            logLevel: 'info',
            userPoolIdResolver:
                async () => (
                    await ssmClient.send(new GetParameterCommand({ Name: ssmParamNames.userPoolIdParamName }))
                ).Parameter?.Value || '',
            userPoolClientIdResolver:
                async () => (
                    await ssmClient.send(new GetParameterCommand({ Name: ssmParamNames.userPoolClientIdParamName }))
                ).Parameter?.Value || '',
            userPoolDomainResolver:
                async () => (
                    await ssmClient.send(new GetParameterCommand({ Name: ssmParamNames.userPoolDomainParamName }))
                ).Parameter?.Value || '',
        });

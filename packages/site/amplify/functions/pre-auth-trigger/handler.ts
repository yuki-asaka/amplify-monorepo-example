import type {Handler, PreAuthenticationTriggerEvent} from 'aws-lambda';

// const githubAppId = process.env.GITHUB_APP_ID as string;
// const githubInstallId = process.env.GITHUB_INSTALL_ID as string;
// const githubOrgName = process.env.GITHUB_ORG_NAME as string;

export const handler: Handler = async (event: PreAuthenticationTriggerEvent) => {
  console.info('PreAuthenticationTriggerEvent received:', JSON.stringify(event));
  return event;
};

import type {Handler, PreAuthenticationTriggerEvent} from 'aws-lambda';
import { env } from "$amplify/env/pre-auth-trigger"
import axios from "axios";
import { sign } from 'jsonwebtoken';


const hasOrganizationMembership = async (organization: string, userId: string, token: string) => {
  try {
    const url = `https://api.github.com/orgs/${organization}/members`;
    const headers = { 'Authorization': `Bearer ${token}` };
    const response = await axios.get(url, { headers });
    const members = response.data;
    let user;
    for (const key in members) {
      if (Object.prototype.hasOwnProperty.call(members[key], 'id')) {
        if (String(members[key].id) === String(userId)) {
          user = members[key];
          break;
        }
      }
    }
    console.debug('user', user);
    console.debug('members', members);
    return !!user;
  } catch (error: any) {
    console.debug('error', error);
    if (error.response.status === 404) {
      return false;
    }
    throw new Error(error);
  }
}

const getToken = (appId: string, secret: string) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now,
    exp: now + 60 * 5,
    iss: appId,
  };
  return sign(payload, secret, { algorithm: 'RS256' });
};

const getCredentials = async (installId: string, token: string) => {
  try {
    const url = `https://api.github.com/app/installations/${installId}/access_tokens`;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: `application/vnd.github.machine-man-preview+json`
    }
    const response = await axios.post(url, {}, { headers });
    return response.data.token;
  } catch (error: any) {
    throw new Error(error);
  }
};


export const handler: Handler = async (event: PreAuthenticationTriggerEvent) => {
  console.info('PreAuthenticationTriggerEvent received:', JSON.stringify(event));

  const token = await getToken(env.APP_ID, env.APP_SECRET);
  console.debug('get token correctly');

  const credentials = await getCredentials(env.INSTALL_ID, token);
  console.debug('get credentials correctly');

  if (!event.request.userAttributes.identities) {
    throw new Error('User attributes identities is not exist');
  }
  // check parse json object
  let identities;
  try {
    identities = JSON.parse(event.request.userAttributes.identities);
  } catch (error) {
    throw new Error('User attributes identities is not valid');
  }

  if (!identities || !Array.isArray(identities)) {
    throw new Error('User attributes identities is not valid');
  }

  const githubIdentity = identities.find(identity => {
    return identity.providerName.toLowerCase() === 'github' && identity.providerType.toLowerCase() === 'oidc';
  });
  if (!githubIdentity) {
    throw new Error('Github identity is not exist');
  }
  if (!githubIdentity.userId) {
    throw new Error('Github identity userId is not exist');
  }

  if (!(await hasOrganizationMembership(env.ORG_NAME, githubIdentity.userId, credentials))) {
    throw new Error('User is not member of the organization');
  }

  return event;
};

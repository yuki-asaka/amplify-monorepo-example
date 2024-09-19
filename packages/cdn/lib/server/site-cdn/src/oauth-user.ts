import { CloudFrontRequestEvent, CloudFrontRequestResult } from 'aws-lambda';

// const logLevel = process.env.LOG_LEVEL || 'INFO';
const logLevel = 'DEBUG';

const log = (level: string, message: string) => {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    if (levels.indexOf(level) >= levels.indexOf(logLevel)) {
        console.log(`[${level}] ${message}`);
    }
};

export const handler = async (event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> => {
    log('DEBUG', `Event received ${JSON.stringify(event)}`);
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    const authHeader = headers['authorization'] ? headers['authorization'][0].value : null;
    if (!authHeader) {
        log('WARN', 'Authorization header missing');
        return {
            status: '401',
            statusDescription: 'Unauthorized',
            body: 'Unauthorized'
        };
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
        log('WARN', 'Token missing in authorization header');
        return {
            status: '401',
            statusDescription: 'Unauthorized',
            body: 'Unauthorized'
        };
    }

    const userUrl = 'https://api.github.com/user';
    log('INFO', `Fetching user info from ${userUrl}`);
    const response = await fetch(userUrl, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/json',
        },
    });

    const obj = await response.json();
    log('DEBUG', `User info received: ${JSON.stringify(obj)}`);

    return {
        status: response.status.toString(),
        statusDescription: response.statusText,
        body: JSON.stringify({
            ...obj,
            sub: obj.id.toString(),
        }),
        headers: {
            'content-type': [{
                key: 'Content-Type',
                value: 'application/json'
            }]
        }
    };
};

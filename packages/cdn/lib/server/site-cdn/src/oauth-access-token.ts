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

    if (request.method !== 'POST') {
        log('WARN', 'Method not allowed');
        return {
            status: '405',
            statusDescription: 'Method Not Allowed',
            body: 'Method Not Allowed'
        };
    }

    const body = request.body?.data;
    if (!body) {
        log('WARN', 'Request body missing');
        return {
            status: '400',
            statusDescription: 'Bad Request',
            body: 'Bad Request'
        };
    }

    const tokenUrl = "https://github.com/login/oauth/access_token";
    log('INFO', `Fetching access token from ${tokenUrl}`);
    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Accept": "application/json",
        },
        body: Buffer.from(body, 'base64').toString('utf-8'),
    });

    const responseBody = await response.json();
    log('DEBUG', `Access token response received: ${JSON.stringify(responseBody)}`);

    return {
        status: response.status.toString(),
        statusDescription: response.statusText,
        body: JSON.stringify(responseBody),
        headers: {
            'content-type': [{
                key: 'Content-Type',
                value: 'application/json'
            }]
        }
    };
};

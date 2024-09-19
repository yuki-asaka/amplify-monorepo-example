import { CloudFrontRequestEvent, CloudFrontRequestResult } from 'aws-lambda';

export const handler = async (event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    const authHeader = headers['Authorization'] ? headers['Authorization'][0].value : null;
    if (!authHeader) {
        return {
            status: '401',
            statusDescription: 'Unauthorized',
            body: 'Unauthorized'
        };
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
        return {
            status: '401',
            statusDescription: 'Unauthorized',
            body: 'Unauthorized'
        };
    }

    const userUrl = 'https://api.github.com/user';
    const response = await fetch(userUrl, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/json',
        },
    });

    const obj = await response.json();
    console.log(obj);

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

import { CloudFrontRequestEvent, CloudFrontRequestResult } from 'aws-lambda';

export const handler = async (event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    if (request.method !== 'POST') {
        return {
            status: '405',
            statusDescription: 'Method Not Allowed',
            body: 'Method Not Allowed'
        };
    }

    const body = request.body?.data;
    if (!body) {
        return {
            status: '400',
            statusDescription: 'Bad Request',
            body: 'Bad Request'
        };
    }

    const tokenUrl = "https://github.com/login/oauth/access_token";
    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Accept": "application/json",
        },
        body,
    });

    const responseBody = await response.json();

    return {
        status: response.status.toString(),
        statusDescription: response.statusText,
        body: JSON.stringify({
            body: responseBody,
            status: response.status,
        }),
        headers: {
            'content-type': [{
                key: 'Content-Type',
                value: 'application/json'
            }]
        }
    };
};

import {Hono} from "hono";
import {secureHeaders} from "hono/secure-headers";
import {logger} from "hono/logger";
import {handle} from "hono/lambda-edge";
import {json} from "node:stream/consumers";
import type {StatusCode} from "hono/dist/types/utils/http-status";

const app = new Hono();

app.use("*", logger(), secureHeaders());
app.use("/oauth/access_token");

app.post("/oauth/access_token", async (c) => {
    const body = await c.req.blob()

    const tokenUrl = "https://github.com/login/oauth/access_token";
    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Accept": "application/json",
        },
        body,
        redirect: "manual"
    });

    // logging response header
    console.log(response.headers);

    // const res = await response.json();

    // logging response body
    // console.log(res);

    return c.json(
        await response.json(),
        response.status as StatusCode,
        // StatusCode.
        // response.headers
    )
});

export const handler = handle(app);

import {Hono} from "hono";
import {secureHeaders} from "hono/secure-headers";
import {logger} from "hono/logger";
import {handle} from "hono/lambda-edge";
import {StatusCode} from "hono/dist/types/utils/http-status";

const app = new Hono();

app.use("*", logger(), secureHeaders());
app.use("/oauth/user");

app.get("/oauth/user", async (c) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
        return new Response("Unauthorized", { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
        return new Response("Unauthorized", { status: 401 });
    }
    const userUrl = "https://api.github.com/user";
    const response = await fetch(userUrl, {
        headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/json",
        },
        redirect: "manual"
    });
    const obj = await response.json();
    // dump the user object to the console
    console.log(obj);

    return c.json(
        {
            ...obj,
            sub: obj.id.toString(),
        },
        response.status as StatusCode
    );
});

export const handler = handle(app);

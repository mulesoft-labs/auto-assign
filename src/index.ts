import { Probot } from "probot";

import { PoolFactory } from "./database/PoolFactory";
import { Handler } from "./handler";

const pool = new PoolFactory().createNewPool();
const handler = new Handler();

export = (app: Probot) => {
    app.log("App started");

    app.on("pull_request.opened", async (context) => {
        app.log("Pull request opened");
        await handler.handlePullRequest(context, pool);
    });

    app.on("issues.opened", async (context) => {
        app.log("Issue opened");
        await handler.handleIssue(context, pool);
    });
};

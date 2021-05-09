/**
 * Emulates the 'probot run src/index.js' command
 *
 * See: https://probot.github.io/docs/development/#use-run
 */
import { run } from "probot";

import app = require("./index");

// tslint:disable:no-floating-promises
// pass a probot app function
run(app);

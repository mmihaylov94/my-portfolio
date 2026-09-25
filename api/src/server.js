import "dotenv/config";
import { beginShutdown, createApp } from "./app.js";
import { describeTrust, loadConfig } from "./config.js";
import { createLogger } from "./http.js";

// The entry point: read the environment, build the app, listen, and stop cleanly.
// Everything else is in app.js, which tests build without any of this.

const log = createLogger();
const config = loadConfig(process.env);
for (const { level, code, message } of config.problems) {
	log[level](code, { detail: message });
}

const app = createApp(config, { log });
const server = app.listen(config.port, "0.0.0.0", () => {
	log.info("api_started", {
		port: config.port,
		chat: config.portfolioAi ? "enabled" : "disabled",
		trust_proxy: describeTrust(config.trustProxy),
	});
});

// Traefik keeps idle connections to this container open for 90 seconds. If Node
// closed them first (its default is 5), a request Traefik sent on one just as it
// closed would fail with a 502, and a POST is never retried.
server.keepAliveTimeout = 95 * 1000;
server.headersTimeout = 96 * 1000;

// Docker stops the container with SIGTERM, and Node, running as PID 1, ignores it
// unless something listens. Stop taking connections, end every open chat stream with
// an error event rather than a silent cut, and exit inside Docker's ten seconds.
process.once("SIGTERM", () => {
	log.info("api_stopping", { open_streams: app.locals.lifecycle.activeStreams.size });
	beginShutdown(app);
	server.close();
	setTimeout(() => process.exit(0), 8000).unref();
});

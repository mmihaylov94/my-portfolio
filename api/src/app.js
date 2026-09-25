import express from "express";
import { createChatRouter } from "./chat.js";
import { createContactRouter } from "./contact.js";
import { errorHandler, jsonNotFound } from "./http.js";

/**
 * The whole API, built from a config object. It never listens and never reads the
 * environment: server.js does both, so a test can build an app of its own on any
 * port with any settings.
 */
export function createApp(config, { log }) {
	const app = express();

	app.disable("x-powered-by");
	// false, a hop count as a number, or a list of addresses: parsed in config.js,
	// never `true`, which would let anyone choose their own address.
	app.set("trust proxy", config.trustProxy);
	// Shared with server.js's shutdown: whether the server is stopping, and every open
	// chat stream's abort, so each one can be ended with a message rather than cut.
	const lifecycle = { closing: false, activeStreams: new Set() };
	app.locals.lifecycle = lifecycle;

	app.get("/api/health", (_req, res) => {
		res.json({ ok: true });
	});
	app.use("/api", createContactRouter(config, { log }));
	app.use("/api", createChatRouter(config, { log, lifecycle }));
	app.use("/api", jsonNotFound(log));
	app.use(errorHandler(log));

	return app;
}

/**
 * Stop taking chat questions and end every open stream with the restarting event.
 * Called by server.js on SIGTERM, before server.close(); a function of its own so the
 * tests exercise the same steps rather than a copy of them.
 */
export function beginShutdown(app) {
	const { lifecycle } = app.locals;
	lifecycle.closing = true;
	for (const abort of lifecycle.activeStreams) abort("shutdown");
	return lifecycle.activeStreams.size;
}

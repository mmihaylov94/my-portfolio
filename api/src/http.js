import rateLimit from "express-rate-limit";

// Helpers shared by the routes: async error handling, rate limits, the JSON 404 and
// error responses, and the log.

/**
 * Express 4 does not catch a rejected promise from an async handler, and on Node 20
 * an unhandled rejection ends the process. This passes the error to Express instead.
 */
export function asyncRoute(handler) {
	return (req, res, next) => {
		Promise.resolve(handler(req, res, next)).catch(next);
	};
}

/**
 * One rate limit, keyed on req.ip, which respects the app's "trust proxy" setting.
 *
 * Created once per app, never inside a handler, so each limiter owns its store. The
 * library's X-Forwarded-For check is off on purpose: it fires only when "trust proxy"
 * is false, and in that mode the startup log already says so in plain words.
 */
export function createLimiter({ limit, windowMs, message }) {
	return rateLimit({
		windowMs,
		limit,
		standardHeaders: "draft-7",
		legacyHeaders: false,
		message: { error: message },
		validate: { xForwardedForHeader: false },
	});
}

export function jsonNotFound(log) {
	return (req, res) => {
		// The icon module asks the server for any icon missing from the client bundle.
		// In production that request lands here, so logging it names the missing icon:
		// only names that look like icon names, since the rest of the URL is anyone's.
		if (req.path.startsWith("/_nuxt_icon")) {
			const collection = /^\/_nuxt_icon\/([a-z0-9-]{1,64})\.json$/.exec(req.path)?.[1] ?? null;
			const icons = typeof req.query.icons === "string"
				? req.query.icons.split(",").filter((name) => /^[a-z0-9-]{1,64}$/.test(name)).slice(0, 20)
				: [];
			log.warn("icon_request_reached_api", { collection, icons });
		}
		res.status(404).json({ error: "Not found." });
	};
}

const CLIENT_ERRORS = {
	400: "Invalid request.",
	413: "That message is too long.",
	415: "Unsupported request.",
};

/**
 * The last handler. Never logs the error object itself: body-parser attaches the raw
 * request body to its errors as `err.body`, which would put a visitor's message in
 * the log.
 */
export function errorHandler(log) {
	// Four parameters, or Express does not treat this as an error handler.
	// eslint-disable-next-line no-unused-vars -- the fourth is unused, but required
	return (err, req, res, _next) => {
		const status = typeof err?.status === "number" && err.status >= 400 && err.status < 500 ? err.status : 500;
		const fields = { type: typeof err?.type === "string" ? err.type : null, status };
		if (status === 500 && !fields.type) fields.name = err?.name ?? null;
		log[status === 500 ? "error" : "warn"]("request_failed", fields);

		if (res.headersSent) {
			res.end();
			return;
		}
		res.status(status).json({ error: CLIENT_ERRORS[status] ?? (status < 500 ? "Invalid request." : "Something went wrong.") });
	};
}

/**
 * One JSON object per line on stdout, which is what `docker compose logs` shows.
 * Callers pass fields that describe a request, never anything a visitor typed.
 */
export function createLogger(write = (line) => process.stdout.write(`${line}\n`)) {
	const emit = (level, event, fields = {}) => {
		write(JSON.stringify({ time: new Date().toISOString(), level, event, ...fields }));
	};
	return {
		info: (event, fields) => emit("info", event, fields),
		warn: (event, fields) => emit("warn", event, fields),
		error: (event, fields) => emit("error", event, fields),
	};
}

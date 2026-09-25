import { once } from "node:events";
import express from "express";
import { asyncRoute, createLimiter } from "./http.js";

// POST /api/chat and POST /api/chat/feedback: the site's side of the AI assistant.
//
// The assistant (portfolio-ai) is private to the Docker network. These routes add its
// key, which the browser never sees, check what the browser sent, and pass answers
// back as they are written. The contract they follow is docs/API.md in the
// portfolio-ai repository, "What the proxy has to do".
//
// Nothing a visitor types goes into a log line: not the message, not the session id,
// not the address. One line per request records how it went.

const SESSION_ID = /^[A-Za-z0-9_-]{8,100}$/;
const MAX_MESSAGE_CHARS = 2000;
const MAX_COMMENT_CHARS = 1000;

// The assistant trims with Rust's str::trim (pydantic), which strips Unicode
// White_Space. That is neither JavaScript's trim(), which also strips U+FEFF but not
// U+0085, nor Python's str.strip(), which also strips U+001C to U+001F. Spelt out, so
// both sides measure a message the same way. A loop rather than a regular expression,
// because `[\s]+$` backtracks quadratically over a long run of spaces.
const WHITE_SPACE = new Set([
	0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20, 0x85, 0xa0, 0x1680,
	0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a,
	0x2028, 0x2029, 0x202f, 0x205f, 0x3000,
]);

function stripWhiteSpace(text) {
	let start = 0;
	let end = text.length;
	while (start < end && WHITE_SPACE.has(text.charCodeAt(start))) start++;
	while (end > start && WHITE_SPACE.has(text.charCodeAt(end - 1))) end--;
	return text.slice(start, end);
}

// C0 control characters and DEL, except tab, line feed and carriage return: what the
// assistant refuses (schemas.py). Checked after trimming, in the same order it does.
function hasControlCharacter(text) {
	for (let i = 0; i < text.length; i++) {
		const code = text.charCodeAt(i);
		if ((code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) || code === 0x7f) return true;
	}
	return false;
}

// Characters, as Python counts them: code points, so an emoji is one, not two.
function codePoints(text) {
	return [...text].length;
}

function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The fields each body may have. Anything else is refused rather than dropped, as the
// assistant refuses it (extra="forbid"): a misspelt field from the chat UI should fail
// in development, not quietly lose a comment.
const CHAT_FIELDS = new Set(["session_id", "message"]);
const FEEDBACK_FIELDS = new Set(["session_id", "message_id", "rating", "comment"]);

function hasOnly(body, fields) {
	return Object.keys(body).every((key) => fields.has(key));
}

function validSessionId(value) {
	return typeof value === "string" && SESSION_ID.test(value);
}

/** The chat body, checked as the assistant checks it, or the reason it is refused. */
export function parseChatBody(body) {
	if (!isObject(body) || !hasOnly(body, CHAT_FIELDS) || !validSessionId(body.session_id)) {
		return { error: "Invalid request." };
	}
	if (typeof body.message !== "string") return { error: "Please write a message." };
	// Half of a surrogate pair, which cutting a string in the wrong place leaves behind.
	// JSON and JavaScript strings can hold one; the assistant's Rust-backed parser cannot.
	if (!body.message.isWellFormed()) return { error: "The message contains characters that cannot be sent." };

	const message = stripWhiteSpace(body.message);
	const length = codePoints(message);
	if (length === 0) return { error: "Please write a message." };
	if (length > MAX_MESSAGE_CHARS) return { error: "A message can be at most 2,000 characters long." };
	if (hasControlCharacter(message)) return { error: "The message contains characters that cannot be sent." };

	return { value: { session_id: body.session_id, message } };
}

/** The feedback body, with the answer's id taken out of it for the URL. */
export function parseFeedbackBody(body) {
	if (!isObject(body) || !hasOnly(body, FEEDBACK_FIELDS) || !validSessionId(body.session_id)) {
		return { error: "Invalid request." };
	}

	// A JSON number that is a whole, positive, exactly representable integer. Nothing
	// else goes into the URL: not "42", not true, not "1/../../chat/stream".
	const messageId = body.message_id;
	if (typeof messageId !== "number" || !Number.isSafeInteger(messageId) || messageId <= 0) {
		return { error: "Invalid request." };
	}
	if (body.rating !== 1 && body.rating !== -1) return { error: "Invalid request." };

	let comment = "";
	if (body.comment !== undefined && body.comment !== null) {
		if (typeof body.comment !== "string") return { error: "Invalid request." };
		if (!body.comment.isWellFormed()) return { error: "The comment contains characters that cannot be sent." };
		comment = stripWhiteSpace(body.comment);
		if (codePoints(comment) > MAX_COMMENT_CHARS) return { error: "A comment can be at most 1,000 characters long." };
		if (hasControlCharacter(comment)) return { error: "The comment contains characters that cannot be sent." };
	}

	return {
		messageId,
		value: { session_id: body.session_id, rating: body.rating, ...(comment ? { comment } : {}) },
	};
}

// Printable ASCII and Latin-1: what a header value read by Node can hold, minus the
// control characters that fetch would refuse to send on.
function cleanHeaderValue(value, maxLength) {
	if (typeof value !== "string") return "";
	return value.replace(/[^\x20-\x7e\xa0-\xff]/g, "").trim().slice(0, maxLength);
}

// The page the visitor was on, without its query string or fragment.
function pageOf(referer) {
	if (typeof referer !== "string" || referer === "") return "";
	try {
		const url = new URL(referer);
		if (url.protocol !== "http:" && url.protocol !== "https:") return "";
		return `${url.origin}${url.pathname}`.slice(0, 2048);
	} catch {
		return "";
	}
}

/**
 * Who is asking, for the assistant's analytics. The address only when the proxies in
 * front of this API are trusted: otherwise req.ip is Traefik's own address, which the
 * assistant would hash identically for every visitor, so none is sent at all.
 */
export function visitorHeaders(req, trustProxy) {
	const headers = {};
	if (trustProxy !== false && req.ip) headers["X-Visitor-IP"] = req.ip;

	const userAgent = cleanHeaderValue(req.get("user-agent"), 512);
	if (userAgent) headers["X-Visitor-User-Agent"] = userAgent;

	const page = pageOf(req.get("referer"));
	if (page) headers["X-Visitor-Referrer"] = page;

	return headers;
}

const UNAVAILABLE = "The assistant is unavailable right now. Please try again in a moment.";
const TOO_SLOW = "The assistant took too long to respond. Please try again.";
const SOMETHING_WRONG = "Something went wrong on our side. Please try again.";

const DEFAULT_DETAIL = {
	404: "There is no such answer in this conversation.",
	409: "A reply in this conversation is still being written.",
	429: "That is a lot of questions in a short time. Please wait a little.",
	503: UNAVAILABLE,
};

// What ends a stream that has already started, as the assistant's own error event.
const STREAM_ERRORS = {
	idle_timeout: { detail: "The answer took too long. Please try again.", status: 504 },
	overall_timeout: { detail: "The answer took too long. Please try again.", status: 504 },
	upstream_broke: { detail: "The answer was interrupted. Please try again.", status: 502 },
	shutdown: { detail: "The assistant is restarting. Please try again in a moment.", status: 503 },
};

const MAX_ERROR_BODY_BYTES = 16 * 1024;

function writable(res) {
	return !res.destroyed && !res.writableEnded;
}

function reply(res, status, body, headers = {}) {
	if (!writable(res) || res.headersSent) return;
	res.status(status).set(headers).json(body);
}

// An error body, read only as far as it can matter. Always read or cancelled: an
// unread body keeps its pooled connection to the assistant busy.
async function readCapped(body) {
	if (!body) return "";
	const reader = body.getReader();
	const chunks = [];
	let size = 0;
	try {
		while (size < MAX_ERROR_BODY_BYTES) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
			size += value.byteLength;
		}
	} catch {
		// A broken error body is as good as none.
	} finally {
		reader.cancel().catch(() => {});
	}
	return Buffer.concat(chunks).subarray(0, MAX_ERROR_BODY_BYTES).toString("utf8");
}

function detailFrom(text) {
	try {
		const detail = JSON.parse(text)?.detail;
		// The assistant's details are fixed sentences written for visitors. Anything
		// else (the list a 422 carries, an HTML error page) is not passed on.
		if (typeof detail === "string" && detail.length > 0) {
			return detail.replace(/[^\x20-\x7e\xa0-\uffff]/g, "").slice(0, 500);
		}
	} catch {
		// Not JSON: no detail.
	}
	return null;
}

/**
 * The assistant refused before any answer began. Passes on what a visitor can act
 * on (wait, retry, the sentence the assistant wrote) and keeps the rest here.
 */
async function sendUpstreamError(res, upstream, log, fields, invalidMessage) {
	const status = upstream.status;
	const detail = detailFrom(await readCapped(upstream.body));
	const retryAfter = upstream.headers.get("retry-after");
	// Seconds only. An HTTP-date is legal but unexpected, and dropped rather than parsed.
	const retryHeaders = retryAfter && /^\d{1,6}$/.test(retryAfter) ? { "Retry-After": retryAfter } : {};

	switch (status) {
		case 404:
		case 409:
			reply(res, status, { error: detail ?? DEFAULT_DETAIL[status] });
			return;
		case 429:
		case 503:
			reply(res, status, { error: detail ?? DEFAULT_DETAIL[status] }, retryHeaders);
			return;
		case 400:
		case 422:
			// Everything was checked here first, so this means the two sides' rules
			// have drifted apart.
			log.warn("upstream_validation_mismatch", { ...fields, upstream_status: status });
			reply(res, 400, { error: invalidMessage });
			return;
		case 401:
		case 403:
			// The keys on the two sides differ. Nothing about it goes to the browser.
			log.error("upstream_auth_failed", { ...fields, upstream_status: status });
			reply(res, 502, { error: UNAVAILABLE });
			return;
		default:
			reply(res, 502, { error: SOMETHING_WRONG });
	}
}

function writeErrorEvent(res, outcome) {
	const error = STREAM_ERRORS[outcome];
	if (!error || !writable(res)) return;
	// relay() only ever writes whole events, so this always starts on a boundary.
	res.write(`event: error\ndata: ${JSON.stringify(error)}\n\n`);
}

// Every event the assistant sends, pings included, ends with a blank line, and it
// writes each one whole, so holding back a partial event costs no time. The limit is
// for an upstream that never ends one.
const EVENT_END = "\n\n";
const MAX_PARTIAL_EVENT_BYTES = 1024 * 1024;

// Copies the assistant's stream to the visitor as it arrives, as raw bytes, but only
// ever whole events. If the connection breaks in the middle of one, the visitor never
// sees its first half: a blank line after a cut-off `data:` line would dispatch it,
// truncated JSON and all, ahead of the error event that explains what happened. A
// reader loop rather than pipe(), so a broken upstream can still be reported to the
// visitor as an error event instead of a connection that just stops.
async function relay(body, res, signal, idle) {
	const reader = body.getReader();
	let partial = Buffer.alloc(0);
	try {
		for (;;) {
			const { done, value } = await reader.read();
			// An unfinished event at the very end is dropped, as a browser would drop it.
			if (done) return;
			idle.refresh();
			if (!writable(res)) return;

			partial = partial.length === 0 ? Buffer.from(value) : Buffer.concat([partial, value]);
			const end = partial.lastIndexOf(EVENT_END);
			if (end === -1) {
				if (partial.length > MAX_PARTIAL_EVENT_BYTES) throw new Error("upstream event too large");
				continue;
			}
			const whole = partial.subarray(0, end + EVENT_END.length);
			partial = partial.subarray(end + EVENT_END.length);
			// A slow visitor: wait until what was written has gone before reading more.
			if (!res.write(whole)) await once(res, "drain", { signal });
		}
	} finally {
		reader.cancel().catch(() => {});
	}
}

export function createChatRouter(config, { log, lifecycle }) {
	const { activeStreams } = lifecycle;
	const { portfolioAi, limits, timeouts, trustProxy } = config;
	const router = express.Router();

	const chatLimiter = createLimiter({
		...limits.chat,
		message: "You have sent a lot of messages in a short time. Please wait a few minutes and try again.",
	});
	const feedbackLimiter = createLimiter({
		...limits.feedback,
		message: "Too many requests. Please wait a few minutes and try again.",
	});
	// These routes only: a 2,000-character message is a few kilobytes even written
	// entirely in escaped emoji.
	const json = express.json({ limit: "32kb" });

	// Off until PORTFOLIO_AI_URL is set, which is how the routes deploy switched off, and
	// off again once the server is stopping. server.close() only closes the connections
	// idle at that moment: one that was busy stays open and can carry a new question,
	// which would start an answer the shutdown then cuts off. Connection: close lets go
	// of it.
	function requireAssistant(_req, res, next) {
		if (lifecycle.closing) {
			res.set({ "Retry-After": "5", Connection: "close" });
			res.status(503).json({ error: STREAM_ERRORS.shutdown.detail });
			return;
		}
		if (portfolioAi) {
			next();
			return;
		}
		res.status(503).json({ error: "The assistant is not available at the moment. Please try again later." });
	}

	function upstreamHeaders(extra) {
		return {
			Authorization: `Bearer ${portfolioAi.apiKey}`,
			"Content-Type": "application/json",
			...extra,
		};
	}

	async function streamChat(req, res) {
		const parsed = parseChatBody(req.body);
		if (parsed.error) {
			res.status(400).json({ error: parsed.error });
			return;
		}

		const started = Date.now();
		const state = { outcome: "completed", upstreamStatus: null, requestId: null, cause: null };
		const controller = new AbortController();
		const abort = (reason) => {
			if (controller.signal.aborted) return;
			state.outcome = reason;
			controller.abort(reason);
		};

		// The visitor may already have gone while the body was being read.
		if (!res.socket || res.socket.destroyed) {
			state.outcome = "client_gone";
			log.info("chat_stream", { status: null, outcome: state.outcome, duration_ms: 0 });
			return;
		}

		// Not req.on("close"): since Node 16 that fires as soon as the request body has
		// been read, which express.json() did before this handler ran. Letting go of the
		// assistant is all this does: the answer is still finished and stored there.
		res.once("close", () => {
			if (!res.writableFinished) abort("client_gone");
		});
		res.on("error", (err) => {
			log.warn("chat_response_error", { code: err?.code ?? null });
		});
		activeStreams.add(abort);
		// Checked again here, where the work starts: a question whose body was still
		// arriving when the shutdown began passed requireAssistant before it, and joined
		// activeStreams too late for the shutdown to abort it.
		if (lifecycle.closing) abort("shutdown");
		const idle = setTimeout(abort, timeouts.chatIdleMs, "idle_timeout");
		const overall = setTimeout(abort, timeouts.chatOverallMs, "overall_timeout");

		try {
			let upstream;
			try {
				upstream = await fetch(`${portfolioAi.baseUrl}/v1/chat/stream`, {
					method: "POST",
					headers: upstreamHeaders({ Accept: "text/event-stream", ...visitorHeaders(req, trustProxy) }),
					body: JSON.stringify(parsed.value),
					signal: controller.signal,
					// The key must never follow a redirect somewhere else.
					redirect: "error",
				});
			} catch (err) {
				if (controller.signal.aborted) {
					if (state.outcome === "shutdown") reply(res, 503, { error: STREAM_ERRORS.shutdown.detail }, { "Retry-After": "5" });
					else if (state.outcome !== "client_gone") reply(res, 504, { error: TOO_SLOW });
					return;
				}
				state.outcome = "unreachable";
				state.cause = err?.cause?.code ?? err?.name ?? null;
				reply(res, 503, { error: UNAVAILABLE });
				return;
			}

			state.upstreamStatus = upstream.status;
			state.requestId = upstream.headers.get("x-request-id");
			idle.refresh();

			if (!upstream.ok) {
				state.outcome = "upstream_error";
				await sendUpstreamError(res, upstream, log, { request_id: state.requestId }, "That message could not be sent.");
				return;
			}
			if (!(upstream.headers.get("content-type") ?? "").startsWith("text/event-stream")) {
				state.outcome = "upstream_error";
				await upstream.body?.cancel().catch(() => {});
				reply(res, 502, { error: SOMETHING_WRONG });
				return;
			}

			res.status(200).set({
				"Content-Type": "text/event-stream; charset=utf-8",
				// no-transform: nothing between here and the browser may re-encode the
				// stream, which is what compressing it would be.
				"Cache-Control": "no-cache, no-transform",
				"X-Accel-Buffering": "no",
			});
			res.flushHeaders();
			res.socket?.setNoDelay(true);
			// A proxy may hold back the status line until some body arrives. This is some.
			res.write(": connected\n\n");

			try {
				await relay(upstream.body, res, controller.signal, idle);
			} catch {
				// The read or the wait was cut short: by a timer, a shutdown, the visitor
				// leaving (nothing to write then), or the assistant's connection breaking.
				if (state.outcome === "completed") state.outcome = "upstream_broke";
				writeErrorEvent(res, state.outcome);
			}
			if (writable(res)) res.end();
		} finally {
			clearTimeout(idle);
			clearTimeout(overall);
			activeStreams.delete(abort);
			const quiet = state.outcome === "completed" || state.outcome === "client_gone";
			log[quiet ? "info" : "warn"]("chat_stream", {
				request_id: state.requestId,
				status: res.headersSent ? res.statusCode : null,
				upstream_status: state.upstreamStatus,
				outcome: state.outcome,
				duration_ms: Date.now() - started,
				...(state.cause ? { cause: state.cause } : {}),
			});
		}
	}

	async function sendFeedback(req, res) {
		const parsed = parseFeedbackBody(req.body);
		if (parsed.error) {
			res.status(400).json({ error: parsed.error });
			return;
		}

		const started = Date.now();
		const state = { outcome: "completed", upstreamStatus: null, requestId: null, cause: null };
		try {
			let upstream;
			try {
				upstream = await fetch(`${portfolioAi.baseUrl}/v1/messages/${parsed.messageId}/feedback`, {
					method: "POST",
					headers: upstreamHeaders({}),
					body: JSON.stringify(parsed.value),
					signal: AbortSignal.timeout(timeouts.feedbackMs),
					redirect: "error",
				});
			} catch (err) {
				if (err?.name === "TimeoutError") {
					state.outcome = "timeout";
					reply(res, 504, { error: TOO_SLOW });
				} else {
					state.outcome = "unreachable";
					state.cause = err?.cause?.code ?? err?.name ?? null;
					reply(res, 503, { error: UNAVAILABLE });
				}
				return;
			}

			state.upstreamStatus = upstream.status;
			state.requestId = upstream.headers.get("x-request-id");
			if (upstream.ok) {
				await upstream.body?.cancel().catch(() => {});
				if (writable(res)) res.status(204).end();
				return;
			}
			state.outcome = "upstream_error";
			await sendUpstreamError(res, upstream, log, { request_id: state.requestId }, "That feedback could not be sent.");
		} finally {
			log[state.outcome === "completed" ? "info" : "warn"]("chat_feedback", {
				request_id: state.requestId,
				status: res.headersSent ? res.statusCode : null,
				upstream_status: state.upstreamStatus,
				outcome: state.outcome,
				duration_ms: Date.now() - started,
				...(state.cause ? { cause: state.cause } : {}),
			});
		}
	}

	// The limiters run first, so a flood is turned away before any body is read.
	router.post("/chat", chatLimiter, requireAssistant, json, asyncRoute(streamChat));
	router.post("/chat/feedback", feedbackLimiter, requireAssistant, json, asyncRoute(sendFeedback));

	return router;
}

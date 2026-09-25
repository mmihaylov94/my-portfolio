import express from "express";
import { asyncRoute, createLimiter } from "./http.js";

// POST /api/contact: validate the form, check reCAPTCHA when it is configured, and
// forward the message to the n8n webhook that emails it.

function asTrimmedString(value) {
	return typeof value === "string" ? value.trim() : "";
}

function webhookUrl(base, path) {
	const pathPart = path.startsWith("/") ? path : `/${path}`;
	return `${base.replace(/\/$/, "")}${pathPart}`;
}

export function createContactRouter(config, { log }) {
	const { contact, limits, timeouts } = config;
	const router = express.Router();

	const limiter = createLimiter({
		...limits.contact,
		message: "Too many requests, please try again later.",
	});

	async function verifyRecaptcha(token) {
		if (!contact.recaptchaSecret) return { success: true };
		if (!token || typeof token !== "string") return { success: false };
		try {
			const params = new URLSearchParams({ secret: contact.recaptchaSecret, response: token });
			const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: params.toString(),
				signal: AbortSignal.timeout(timeouts.contactMs),
			});
			const data = await response.json();
			return { success: !!data.success, score: data.score };
		} catch (err) {
			log.error("recaptcha_verify_failed", { cause: err?.cause?.code ?? err?.name ?? null });
			return { success: false };
		}
	}

	async function postToWebhook(payload, res) {
		if (!contact.webhookUrl) {
			// Deliberately vague: this reaches the public, and a variable name is a detail
			// of the server, not something a visitor can act on.
			res.status(503).json({ error: "The contact form is not available at the moment." });
			return;
		}
		try {
			const response = await fetch(webhookUrl(contact.webhookUrl, contact.webhookPath), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(contact.apiKey ? { apikey: contact.apiKey } : {}),
				},
				body: JSON.stringify(payload),
				signal: AbortSignal.timeout(timeouts.contactMs),
			});
			const text = await response.text();
			if (!response.ok) {
				// The webhook's own response stays on the server: it can describe n8n's
				// internals, and it is no use to the visitor.
				log.warn("contact_webhook_failed", { upstream_status: response.status });
				res.status(response.status).json({ error: "Webhook request failed" });
				return;
			}
			try {
				res.json(JSON.parse(text));
			} catch {
				res.json({ ok: true });
			}
		} catch (err) {
			log.error("contact_webhook_unreachable", { cause: err?.cause?.code ?? err?.name ?? null });
			res.status(502).json({ error: "Failed to reach webhook" });
		}
	}

	router.post("/contact", limiter, express.json({ limit: "1mb" }), asyncRoute(async (req, res) => {
		const { email, subject, message, reason, recaptchaToken } = req.body || {};
		const emailValue = asTrimmedString(email);
		const subjectValue = asTrimmedString(subject);
		const messageValue = asTrimmedString(message);
		const reasonValue = asTrimmedString(reason);

		if (!emailValue || !subjectValue || !messageValue || !reasonValue) {
			res.status(400).json({ error: "Missing or invalid: email, subject, message, reason" });
			return;
		}
		if (contact.recaptchaSecret) {
			if (!recaptchaToken) {
				res.status(400).json({ error: "reCAPTCHA verification required" });
				return;
			}
			const { success, score } = await verifyRecaptcha(recaptchaToken);
			if (!success) {
				res.status(400).json({ error: "reCAPTCHA verification failed" });
				return;
			}
			if (typeof score === "number" && score < 0.5) {
				res.status(400).json({ error: "reCAPTCHA score too low" });
				return;
			}
		}
		const payload = { email: emailValue, subject: subjectValue, message: messageValue, reason: reasonValue };
		await postToWebhook(payload, res);
	}));

	return router;
}

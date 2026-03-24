import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";

const app = express();

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const CONTACT_WEBHOOK_PATH = process.env.N8N_CONTACT_WEBHOOK_PATH || "/contact";

app.use(express.json({ limit: "1mb" }));

function createLimiter(limit, windowMs) {
	return rateLimit({
		windowMs,
		limit,
		standardHeaders: "draft-7",
		legacyHeaders: false,
		message: { error: "Too many requests, please try again later." },
	});
}

const contactLimiter = createLimiter(5, 15 * 60 * 1000); // 5 requests / 15 minutes

app.get("/api/health", (req, res) => {
	res.json({ ok: true });
});

function buildN8nWebhookUrl(webhookPath) {
	const base = N8N_WEBHOOK_URL.replace(/\/$/, "");
	const pathPart = webhookPath.startsWith("/") ? webhookPath : `/${webhookPath}`;
	return `${base}${pathPart}`;
}

async function postToN8n(webhookPath, payload, res) {
	if (!N8N_WEBHOOK_URL) {
		res.status(503).json({ error: "Webhook not configured (set N8N_WEBHOOK_URL in api/.env)" });
		return;
	}
	if (!webhookPath) {
		res.status(500).json({ error: "Invalid webhook path" });
		return;
	}
	try {
		const response = await fetch(buildN8nWebhookUrl(webhookPath), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(N8N_API_KEY ? { apikey: N8N_API_KEY } : {}),
			},
			body: JSON.stringify(payload),
		});
		const text = await response.text();
		if (!response.ok) {
			res.status(response.status).json({
				error: "Webhook request failed",
				details: text || response.statusText,
			});
			return;
		}
		try {
			const json = JSON.parse(text);
			res.json(json);
		} catch {
			res.json({ ok: true });
		}
	} catch (err) {
		console.error("n8n webhook error:", err);
		res.status(502).json({ error: "Failed to reach webhook" });
	}
}

async function verifyRecaptcha(token) {
	if (!RECAPTCHA_SECRET_KEY) return { success: true };
	if (!token || typeof token !== "string") return { success: false };
	try {
		const params = new URLSearchParams({
			secret: RECAPTCHA_SECRET_KEY,
			response: token,
		});
		const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: params.toString(),
		});
		const data = await response.json();
		return { success: !!data.success, score: data.score };
	} catch (err) {
		console.error("recaptcha verify error:", err);
		return { success: false };
	}
}

function asTrimmedString(value) {
	return typeof value === "string" ? value.trim() : "";
}

app.post("/api/contact", contactLimiter, async (req, res) => {
	const { email, subject, message, reason, recaptchaToken } = req.body || {};
	const emailValue = asTrimmedString(email);
	const subjectValue = asTrimmedString(subject);
	const messageValue = asTrimmedString(message);
	const reasonValue = asTrimmedString(reason);

	if (
		!emailValue ||
		!subjectValue ||
		!messageValue ||
		!reasonValue
	) {
		res.status(400).json({ error: "Missing or invalid: email, subject, message, reason" });
		return;
	}
	if (RECAPTCHA_SECRET_KEY) {
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
	await postToN8n(CONTACT_WEBHOOK_PATH, payload, res);
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
	console.log(`API listening on 0.0.0.0:${port}`);
});

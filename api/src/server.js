import express from "express";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
	res.json({ ok: true });
});

app.post("/api/contact", (req, res) => {
	// TODO validate + store + notify
	res.json({ ok: true });
});

app.post("/api/chat", (req, res) => {
	// TODO LLM + RAG + tools
	res.json({ ok: true });
});

app.post("/api/feedback", (req, res) => {
	// TODO store feedback
	res.json({ ok: true });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
	console.log(`API listening on 0.0.0.0:${port}`);
});

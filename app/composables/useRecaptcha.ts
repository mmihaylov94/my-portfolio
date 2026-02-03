declare global {
	interface Window {
		grecaptcha?: {
			ready: (cb: () => void) => void
			execute: (siteKey: string, options: { action: string }) => Promise<string>
		}
	}
}

export function useRecaptcha() {
	const config = useRuntimeConfig()
	const siteKey = config.public.recaptchaSiteKey as string

	async function loadScript(): Promise<void> {
		if (typeof window === "undefined" || !siteKey) return
		if (window.grecaptcha) return

		return new Promise((resolve, reject) => {
			const script = document.createElement("script")
			script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}&badge=bottomleft`
			script.async = true
			script.onload = () => resolve()
			script.onerror = () => reject(new Error("Failed to load reCAPTCHA"))
			document.head.appendChild(script)
		})
	}

	async function execute(action = "contact"): Promise<string | null> {
		if (!siteKey) return null
		if (typeof window === "undefined") return null

		await loadScript()
		if (!window.grecaptcha) return null

		return new Promise((resolve) => {
			window.grecaptcha!.ready(async () => {
				try {
					const token = await window.grecaptcha!.execute(siteKey, { action })
					resolve(token)
				} catch {
					resolve(null)
				}
			})
		})
	}

	return { execute, isEnabled: !!siteKey }
}

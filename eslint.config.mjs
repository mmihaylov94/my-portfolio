// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
	rules: {
		// Allow tabs (codebase uses tabs)
		"@stylistic/no-tabs": "off",
		// Use tabs for indentation
		indent: "off",
		"@stylistic/indent": "off",
		"@typescript-eslint/indent": "off",
		// Vue-specific indentation - allow tabs
		"vue/script-indent": "off",
		"vue/html-indent": "off",
		// Enforce double quotes
		quotes: ["error", "double", { avoidEscape: true }],
		"@stylistic/quotes": ["error", "double", { avoidEscape: true }],
		"@stylistic/quote-props": ["error", "as-needed"],
		// Allow trailing commas (codebase uses them)
		"comma-dangle": "off",
		"@stylistic/comma-dangle": "off",
		"vue/comma-dangle": "off",
		// Allow semicolons
		"@stylistic/semi": ["error", "always"],
		// TypeScript interface/type member delimiters - allow semicolons
		"@stylistic/member-delimiter-style": "off",
		// Operator linebreak - be more flexible
		"@stylistic/operator-linebreak": "off",
		// Arrow function parens - allow both styles
		"@stylistic/arrow-parens": "off",
		// Vue HTML self-closing - be more flexible
		"vue/html-self-closing": "off",
		// Vue max attributes per line - be more flexible
		"vue/max-attributes-per-line": "off",
		// Vue attributes order - be more flexible
		"vue/attributes-order": "off",
		// Vue no multiple template root - allow (Vue 3 supports multiple roots)
		"vue/no-multiple-template-root": "off",
		// Unused variables - only warn for unused vars starting with _
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{
				argsIgnorePattern: "^_",
				varsIgnorePattern: "^_",
			},
		],
		// Nuxt config keys order - be more flexible
		"nuxt/nuxt-config-keys-order": "off",
	},
});

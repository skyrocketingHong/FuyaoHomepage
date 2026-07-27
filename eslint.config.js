import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },

		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],

		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		files: [
			'src/lib/components/albums/PhotoLightbox.svelte',
			'src/lib/components/blog/viewer/LinkPreview.svelte',
			'src/lib/components/friends/FriendCard.svelte',
			'src/lib/components/friends/ProfileCard.svelte',
			'src/lib/components/layout/bottom-info/CopyrightText.svelte',
			'src/lib/components/layout/bottom-info/ServiceStatus.svelte',
			'src/lib/components/pay/QRCodeCard.svelte'
		],
		rules: {
			// These components intentionally render validated external URLs.
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		files: [
			'src/lib/components/blog/viewer/MarkdownRenderer.svelte',
			'src/lib/components/seo/SeoHead.svelte'
		],
		rules: {
			// HTML is produced by the allowlisted Markdown pipeline or escaped JSON-LD serializer.
			'svelte/no-at-html-tags': 'off'
		}
	}
);

import { defineMiddleware } from 'astro:middleware';

/** Hashed build assets can be cached forever; the filename changes when the file changes. */
const IMMUTABLE_ASSET = /^\/_astro\//;
const API_PATH = /^\/api\//;

export const onRequest = defineMiddleware(async (context, next) => {
	const response = await next();
	const { pathname } = context.url;

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	if (IMMUTABLE_ASSET.test(pathname)) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	} else if (!API_PATH.test(pathname) && response.status === 200) {
		// Static HTML shells: edge cache + short SWR (API stays uncached).
		response.headers.set(
			'Cache-Control',
			'public, s-maxage=60, stale-while-revalidate=300',
		);
	}

	return response;
});

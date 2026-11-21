/**
 * Prefixes the site base path to internal links written as absolute paths in Markdown, such as
 * `/getting-started/`, so that pages work when the site is served under a sub-path.
 */
export function rehypeBaseLinks(base) {
	const prefix = !base || base === '/' ? '' : base.replace(/\/$/, '');
	return () => (tree) => {
		if (!prefix) return;
		const visit = (node) => {
			const href = node.properties?.href;
			if (node.tagName === 'a' && typeof href === 'string' && isInternalAbsolute(href, prefix)) {
				node.properties.href = `${prefix}${href}`;
			}
			node.children?.forEach(visit);
		};
		visit(tree);
	};
}

function isInternalAbsolute(href, prefix) {
	return href.startsWith('/') && !href.startsWith('//') && !href.startsWith(`${prefix}/`);
}

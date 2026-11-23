import { socialCardSize } from './card';

export interface HeadTag {
	tag: 'meta';
	attrs: Record<string, string>;
}

export function socialImageTags(imageUrl: string, alternativeText: string): HeadTag[] {
	return [
		{ tag: 'meta', attrs: { property: 'og:image', content: imageUrl } },
		{ tag: 'meta', attrs: { property: 'og:image:width', content: String(socialCardSize.width) } },
		{ tag: 'meta', attrs: { property: 'og:image:height', content: String(socialCardSize.height) } },
		{ tag: 'meta', attrs: { property: 'og:image:alt', content: alternativeText } },
		{ tag: 'meta', attrs: { name: 'twitter:image', content: imageUrl } },
	];
}

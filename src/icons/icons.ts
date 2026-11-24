import { Resvg } from '@resvg/resvg-js';

export function renderPng(svg: string, width: number): Uint8Array {
	return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

export function icoFromPngs(images: { size: number; png: Uint8Array }[]): Uint8Array {
	const headerSize = 6;
	const entrySize = 16;
	const header = Buffer.alloc(headerSize + entrySize * images.length);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);
	let offset = header.length;
	images.forEach(({ size, png }, index) => {
		const entry = headerSize + entrySize * index;
		header.writeUInt8(size >= 256 ? 0 : size, entry);
		header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
		header.writeUInt8(0, entry + 2);
		header.writeUInt8(0, entry + 3);
		header.writeUInt16LE(1, entry + 4);
		header.writeUInt16LE(32, entry + 6);
		header.writeUInt32LE(png.length, entry + 8);
		header.writeUInt32LE(offset, entry + 12);
		offset += png.length;
	});
	return Buffer.concat([header, ...images.map(({ png }) => Buffer.from(png))]);
}

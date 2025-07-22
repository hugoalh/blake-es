export type Blake2AcceptDataType =
	| string
	| Uint8Array;
export interface Blake2Options {
	/**
	 * Data.
	 */
	data?: Blake2AcceptDataType;
	/**
	 * Key.
	 */
	key?: Uint8Array;
	/**
	 * Length of the output, in bytes.
	 * @default {32}
	 */
	length?: number;
}
/** Initialization vector. */
export const iv: Uint32Array = Uint32Array.from([
	0xF3BCC908, 0x6A09E667, 0x84CAA73B, 0xBB67AE85,
	0xFE94F82B, 0x3C6EF372, 0x5F1D36F1, 0xA54FF53A,
	0xADE682D1, 0x510E527F, 0x2B3E6C1F, 0x9B05688C,
	0xFB41BD6B, 0x1F83D9AB, 0x137E2179, 0x5BE0CD19
]);
export const sigma: Uint8Array = Uint8Array.from([
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
	14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
	11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
	7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
	9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
	2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
	12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
	13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
	6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
	10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0
]);
/** Little-endian byte access */
export function get32(v: Uint8Array, i: number): number {
	return (v[i] ^ (v[i + 1] << 8) ^ (v[i + 2] << 16) ^ (v[i + 3] << 24));
}
export function normalizeInput(input: string | Uint8Array): Uint8Array {
	return ((input instanceof Uint8Array) ? input : new TextEncoder().encode(input));
}

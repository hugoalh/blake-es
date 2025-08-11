import {
	get32,
	iv,
	sigma,
	toUint8Array,
	type Blake2AcceptDataType,
	type Blake2Options
} from "./_common.ts";
export type {
	Blake2AcceptDataType,
	Blake2Options
} from "./_common.ts";
/** Initialization vector with trim. */
const ivTrim: Uint32Array = Uint32Array.from(Array.from(iv).filter((_value: number, index: number): boolean => {
	return ((index + 1) % 2 === 0);
}));
// 32-bit right rotation
// x should be a uint32
// y must be between 1 and 31, inclusive
function ROTR32(x: number, y: number): number {
	return ((x >>> y) ^ (x << (32 - y)));
}
/**
 * Get the non-cryptographic hash of the data with algorithm Blake2S.
 */
export class Blake2S {
	get [Symbol.toStringTag](): string {
		return "Blake2S";
	}
	#freezed: boolean = false;
	#hashHex: string | null = null;
	#hashUint8Array: Uint8Array | null = null;
	#b: Uint8Array = new Uint8Array(64);
	/** Pointer within buffer. */
	#c: number = 0;
	#h: Uint32Array = Uint32Array.from(ivTrim);
	/** Output length in bytes. */
	#length: number;
	#m: Uint32Array = new Uint32Array(16);
	/** Input count. */
	#t: number = 0;
	#v: Uint32Array = new Uint32Array(16);
	/**
	 * Initialize.
	 * @param {Blake2Options} [input={}] Input. Data can append later via the method {@linkcode Blake2S.update} and {@linkcode Blake2S.updateFromStream}.
	 */
	constructor(input: Blake2Options = {}) {
		const {
			data,
			key,
			length = 32
		}: Blake2Options = input;
		if (!(Number.isSafeInteger(length) && length > 0 && length <= 32)) {
			throw new TypeError(`Parameter \`length\` is not a valid number which is integer and in range 1 ~ 32!`);
		}
		this.#length = length;
		if (typeof key !== "undefined" && key.length > 32) {
			throw new TypeError(`Parameter \`key\` is not a valid key which length is <= 32!`);
		}
		this.#h[0] ^= 0x01010000 ^ ((key?.length ?? 0) << 8) ^ this.#length;
		// Key the hash if applicable
		if (typeof key !== "undefined") {
			this.update(key);
			this.#c = 64;
		}
		if (typeof data !== "undefined") {
			this.update(data);
		}
	}
	/**
	 * Whether the instance is freezed.
	 * @returns {boolean}
	 */
	get freezed(): boolean {
		return this.#freezed;
	}
	/**
	 * Length of the output, in bytes.
	 * @returns {number}
	 */
	get length(): number {
		return this.#length;
	}
	/**
	 * Freeze the instance to prevent any further update.
	 * @returns {this}
	 */
	freeze(): this {
		this.#freezed = true;
		return this;
	}
	// G Mixing function
	// The ROTRs are inlined for speed
	#gMix(a: number, b: number, c: number, d: number, x: number, y: number): void {
		this.#v[a] = this.#v[a] + this.#v[b] + x;
		this.#v[d] = ROTR32(this.#v[d] ^ this.#v[a], 16);
		this.#v[c] = this.#v[c] + this.#v[d];
		this.#v[b] = ROTR32(this.#v[b] ^ this.#v[c], 12);
		this.#v[a] = this.#v[a] + this.#v[b] + y;
		this.#v[d] = ROTR32(this.#v[d] ^ this.#v[a], 8);
		this.#v[c] = this.#v[c] + this.#v[d];
		this.#v[b] = ROTR32(this.#v[b] ^ this.#v[c], 7);
	}
	#compress(last: boolean = false): void {
		for (let i: number = 0; i < 8; i++) {
			// Init work variables
			this.#v[i] = this.#h[i];
			this.#v[i + 8] = ivTrim[i];
		}

		this.#v[12] ^= this.#t; // low 32 bits of offset
		this.#v[13] ^= this.#t / 0x100000000; // high 32 bits
		if (last) {
			// last block flag set ?
			this.#v[14] = ~this.#v[14];
		}

		for (let i: number = 0; i < 16; i++) {
			// Get little-endian words
			this.#m[i] = get32(this.#b, 4 * i);
		}

		// Ten rounds of mixing
		for (let i: number = 0; i < 10; i++) {
			this.#gMix(0, 4, 8, 12, this.#m[sigma[i * 16 + 0]], this.#m[sigma[i * 16 + 1]]);
			this.#gMix(1, 5, 9, 13, this.#m[sigma[i * 16 + 2]], this.#m[sigma[i * 16 + 3]]);
			this.#gMix(2, 6, 10, 14, this.#m[sigma[i * 16 + 4]], this.#m[sigma[i * 16 + 5]]);
			this.#gMix(3, 7, 11, 15, this.#m[sigma[i * 16 + 6]], this.#m[sigma[i * 16 + 7]]);
			this.#gMix(0, 5, 10, 15, this.#m[sigma[i * 16 + 8]], this.#m[sigma[i * 16 + 9]]);
			this.#gMix(1, 6, 11, 12, this.#m[sigma[i * 16 + 10]], this.#m[sigma[i * 16 + 11]]);
			this.#gMix(2, 7, 8, 13, this.#m[sigma[i * 16 + 12]], this.#m[sigma[i * 16 + 13]]);
			this.#gMix(3, 4, 9, 14, this.#m[sigma[i * 16 + 14]], this.#m[sigma[i * 16 + 15]]);
		}
		for (let i: number = 0; i < 8; i++) {
			this.#h[i] ^= this.#v[i] ^ this.#v[i + 8];
		}
	}
	/**
	 * Get the non-cryptographic hash of the data, in original format.
	 * @returns {Uint8Array}
	 */
	hash(): Uint8Array {
		this.#freezed = true;
		if (this.#hashUint8Array === null) {
			this.#t += this.#c; // Mark last block offset
			while (this.#c < 64) {
				// Fill up with zeros
				this.#b[this.#c++] = 0;
			}
			this.#compress(true); // Final block flag = 1

			// Little endian convert and store
			this.#hashUint8Array = new Uint8Array(this.#length);
			for (let i: number = 0; i < this.#length; i++) {
				this.#hashUint8Array[i] = this.#h[i >> 2] >> (8 * (i & 3)) & 0xFF;
			}
		}
		return Uint8Array.from(this.#hashUint8Array);
	}
	/**
	 * Get the non-cryptographic hash of the data, in hexadecimal with padding.
	 * @returns {string}
	 */
	hashHex(): string {
		this.#hashHex ??= Array.from(this.hash(), (byte: number): string => {
			return byte.toString(16).toUpperCase().padStart(2, "0");
		}).join("");
		return this.#hashHex;
	}
	/**
	 * Append data.
	 * @param {Blake2AcceptDataType} data Data.
	 * @returns {this}
	 */
	update(data: Blake2AcceptDataType): this {
		if (this.#freezed) {
			throw new Error(`Instance is freezed!`);
		}
		for (const byte of toUint8Array(data)) {
			if (this.#c === 64) {
				// Buffer full?
				this.#t += this.#c; // Add counters
				this.#compress(); // Compress (not last)
				this.#c = 0; // Counter to zero
			}
			this.#b[this.#c++] = byte;
		}
		return this;
	}
	/**
	 * Append data from the readable stream.
	 * @param {ReadableStream<Blake2AcceptDataType>} stream Data from the readable stream.
	 * @returns {Promise<this>}
	 */
	async updateFromStream(stream: ReadableStream<Blake2AcceptDataType>): Promise<this> {
		for await (const chunk of stream) {
			this.update(chunk);
		}
		return this;
	}
}
export default Blake2S;

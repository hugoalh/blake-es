import {
	get32,
	iv,
	normalizeInput,
	sigma,
	type Blake2AcceptDataType,
	type Blake2Options
} from "./_common.ts";
const sigma64: Uint8Array = Uint8Array.from([...Array.from(sigma), ...Array.from(sigma).slice(0, 32)].map((x: number): number => {
	return (x * 2);
}));
export interface Blake2BOptions extends Blake2Options {
	/**
	 * Length of the output, in bytes.
	 * @default {64}
	 */
	length?: number;
	/**
	 * Personal.
	 */
	personal?: string | Uint8Array;
	/**
	 * Salt.
	 */
	salt?: string | Uint8Array;
}
// 64-bit unsigned addition
// Sets v[a,a+1] += v[b,b+1]
function ADD64AA(v: Uint32Array, a: number, b: number): void {
	const o0: number = v[a] + v[b];
	let o1: number = v[a + 1] + v[b + 1];
	if (o0 >= 0x100000000) {
		o1++;
	}
	v[a] = o0;
	v[a + 1] = o1;
}
// 64-bit unsigned addition
// Sets v[a,a+1] += b
// b0 is the low 32 bits of b, b1 represents the high 32 bits
function ADD64AC(v: Uint32Array, a: number, b0: number, b1: number): void {
	let o0: number = v[a] + b0;
	if (b0 < 0) {
		o0 += 0x100000000;
	}
	let o1: number = v[a + 1] + b1;
	if (o0 >= 0x100000000) {
		o1++;
	}
	v[a] = o0;
	v[a + 1] = o1;
}
/**
 * Get the non-cryptographic hash of the data with algorithm Blake2B.
 */
export class Blake2B {
	get [Symbol.toStringTag](): string {
		return "Blake2B";
	}
	#freezed: boolean = false;
	#hashHex: string | null = null;
	#hashUint8Array: Uint8Array | null = null;
	#b: Uint8Array = new Uint8Array(128);
	/** Pointer within buffer. */
	#c: number = 0;
	#h: Uint32Array = new Uint32Array(16);
	/** Output length in bytes. */
	#length: number;
	#m: Uint32Array = new Uint32Array(32);
	#parameterBlock: Uint8Array = Uint8Array.from([
		0, 0, 1, 1,//  0: OutLen, KeyLen, FanOut, Depth
		0, 0, 0, 0,//  4: Leaf length, Sequential mode
		0, 0, 0, 0,//  8: Node offset
		0, 0, 0, 0,// 12: Node offset
		0, 0, 0, 0,// 16: Node depth, Inner length, Rfu
		0, 0, 0, 0,// 20: Rfu
		0, 0, 0, 0,// 24: Rfu
		0, 0, 0, 0,// 28: Rfu
		0, 0, 0, 0,// 32: Salt
		0, 0, 0, 0,// 36: Salt
		0, 0, 0, 0,// 40: Salt
		0, 0, 0, 0,// 44: Salt
		0, 0, 0, 0,// 48: Personal
		0, 0, 0, 0,// 52: Personal
		0, 0, 0, 0,// 56: Personal
		0, 0, 0, 0 // 60: Personal
	]);
	/** Input count. */
	#t: number = 0;
	#v: Uint32Array = new Uint32Array(32);
	/**
	 * Initialize.
	 * @param {Blake2BOptions} [input={}] Input. Data can append later via the method {@linkcode Blake2B.update} and {@linkcode Blake2B.updateFromStream}.
	 */
	constructor(input: Blake2BOptions = {}) {
		const {
			data,
			key,
			length = 64,
			personal,
			salt
		}: Blake2BOptions = input;
		if (!(Number.isSafeInteger(length) && length > 0 && length <= 64)) {
			throw new TypeError(`Parameter \`length\` is not a valid number which is integer and in range 1 ~ 64!`);
		}
		this.#length = length;
		this.#parameterBlock[0] = this.#length;
		if (typeof key !== "undefined") {
			if (key.length > 64) {
				throw new TypeError(`Parameter \`key\` is not a valid key which length is <= 64!`);
			}
			this.#parameterBlock[1] = key.length;
		}
		if (typeof salt !== "undefined") {
			if (salt.length !== 16) {
				throw new TypeError(`Parameter \`salt\` is not a valid key which length is 16!`);
			}
			this.#parameterBlock.set(normalizeInput(salt), 32);
		}
		if (typeof personal !== "undefined") {
			if (personal.length !== 16) {
				throw new TypeError(`Parameter \`personal\` is not a valid key which length is 16!`);
			}
			this.#parameterBlock.set(normalizeInput(personal), 48);
		}
		// Initialize hash state
		for (let i: number = 0; i < 16; i++) {
			this.#h[i] = iv[i] ^ get32(this.#parameterBlock, i * 4);
		}
		// Key the hash if applicable
		if (typeof key !== "undefined") {
			this.update(key);
			this.#c = 128;
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
	#gMix(a: number, b: number, c: number, d: number, ix: number, iy: number): void {
		const x0: number = this.#m[ix];
		const x1: number = this.#m[ix + 1];
		const y0: number = this.#m[iy];
		const y1: number = this.#m[iy + 1];

		ADD64AA(this.#v, a, b); // v[a,a+1] += v[b,b+1] ... in JS we must store a uint64 as two uint32s
		ADD64AC(this.#v, a, x0, x1); // v[a, a+1] += x ... x0 is the low 32 bits of x, x1 is the high 32 bits

		// v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated to the right by 32 bits
		let xor0: number = this.#v[d] ^ this.#v[a];
		let xor1: number = this.#v[d + 1] ^ this.#v[a + 1];
		this.#v[d] = xor1;
		this.#v[d + 1] = xor0;

		ADD64AA(this.#v, c, d);

		// v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 24 bits
		xor0 = this.#v[b] ^ this.#v[c];
		xor1 = this.#v[b + 1] ^ this.#v[c + 1];
		this.#v[b] = (xor0 >>> 24) ^ (xor1 << 8);
		this.#v[b + 1] = (xor1 >>> 24) ^ (xor0 << 8);

		ADD64AA(this.#v, a, b);
		ADD64AC(this.#v, a, y0, y1);

		// v[d,d+1] = (v[d,d+1] xor v[a,a+1]) rotated right by 16 bits
		xor0 = this.#v[d] ^ this.#v[a];
		xor1 = this.#v[d + 1] ^ this.#v[a + 1];
		this.#v[d] = (xor0 >>> 16) ^ (xor1 << 16);
		this.#v[d + 1] = (xor1 >>> 16) ^ (xor0 << 16);

		ADD64AA(this.#v, c, d);

		// v[b,b+1] = (v[b,b+1] xor v[c,c+1]) rotated right by 63 bits
		xor0 = this.#v[b] ^ this.#v[c];
		xor1 = this.#v[b + 1] ^ this.#v[c + 1];
		this.#v[b] = (xor1 >>> 31) ^ (xor0 << 1);
		this.#v[b + 1] = (xor0 >>> 31) ^ (xor1 << 1);
	}
	#compress(last: boolean = false): void {
		// Init work variables
		for (let i: number = 0; i < 16; i++) {
			this.#v[i] = this.#h[i];
			this.#v[i + 16] = iv[i];
		}

		// Low 64 bits of offset
		this.#v[24] = this.#v[24] ^ this.#t;
		this.#v[25] = this.#v[25] ^ (this.#t / 0x100000000);
		// High 64 bits not supported, offset may not be higher than 2**53-1

		// Last block flag set?
		if (last) {
			this.#v[28] = ~this.#v[28];
			this.#v[29] = ~this.#v[29];
		}

		// Get little-endian words
		for (let i: number = 0; i < 32; i++) {
			this.#m[i] = get32(this.#b, 4 * i);
		}

		// Twelve rounds of mixing
		for (let i: number = 0; i < 12; i++) {
			this.#gMix(0, 8, 16, 24, sigma64[i * 16 + 0], sigma64[i * 16 + 1]);
			this.#gMix(2, 10, 18, 26, sigma64[i * 16 + 2], sigma64[i * 16 + 3]);
			this.#gMix(4, 12, 20, 28, sigma64[i * 16 + 4], sigma64[i * 16 + 5]);
			this.#gMix(6, 14, 22, 30, sigma64[i * 16 + 6], sigma64[i * 16 + 7]);
			this.#gMix(0, 10, 20, 30, sigma64[i * 16 + 8], sigma64[i * 16 + 9]);
			this.#gMix(2, 12, 22, 24, sigma64[i * 16 + 10], sigma64[i * 16 + 11]);
			this.#gMix(4, 14, 16, 26, sigma64[i * 16 + 12], sigma64[i * 16 + 13]);
			this.#gMix(6, 8, 18, 28, sigma64[i * 16 + 14], sigma64[i * 16 + 15]);
		}
		for (let i: number = 0; i < 16; i++) {
			this.#h[i] = this.#h[i] ^ this.#v[i] ^ this.#v[i + 16];
		}
	}
	/**
	 * Get the non-cryptographic hash of the data, in Uint8Array.
	 * @returns {Uint8Array}
	 */
	hash(): Uint8Array {
		this.#freezed = true;
		if (this.#hashUint8Array === null) {
			this.#t += this.#c; // Mark last block offset
			while (this.#c < 128) {
				// Fill up with zeros
				this.#b[this.#c++] = 0;
			}
			this.#compress(true); // Final block flag = 1

			// Little endian convert and store
			this.#hashUint8Array = new Uint8Array(this.#length);
			for (let i: number = 0; i < this.#length; i++) {
				this.#hashUint8Array[i] = this.#h[i >> 2] >> (8 * (i & 3));
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
		const dataFmt: Uint8Array = normalizeInput(data);
		for (const byte of dataFmt) {
			if (this.#c === 128) {
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
export default Blake2B;

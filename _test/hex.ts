import { Buffer } from "node:buffer";
export function fromHex(value: string): Uint8Array {
	return Uint8Array.from(Buffer.from(value, "hex"));
}
export function toHex(value: Uint8Array): string {
	return Buffer.from(value).toString("hex");
}

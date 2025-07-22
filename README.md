# Blake (ES)

[**⚖️** MIT](./LICENSE.md)

[![GitHub: hugoalh/blake-es](https://img.shields.io/github/v/release/hugoalh/blake-es?label=hugoalh/blake-es&labelColor=181717&logo=github&logoColor=ffffff&sort=semver&style=flat "GitHub: hugoalh/blake-es")](https://github.com/hugoalh/blake-es)
[![JSR: @hugoalh/blake](https://img.shields.io/jsr/v/@hugoalh/blake?label=@hugoalh/blake&labelColor=F7DF1E&logo=jsr&logoColor=000000&style=flat "JSR: @hugoalh/blake")](https://jsr.io/@hugoalh/blake)
[![NPM: @hugoalh/blake](https://img.shields.io/npm/v/@hugoalh/blake?label=@hugoalh/blake&labelColor=CB3837&logo=npm&logoColor=ffffff&style=flat "NPM: @hugoalh/blake")](https://www.npmjs.com/package/@hugoalh/blake)

An ECMAScript (JavaScript & TypeScript) module to get the non-cryptographic hash of the data with algorithm Blake.

Currently, only Blake2B and Blake2S are supported.

## 🔰 Begin

### 🎯 Targets

| **Targets** | **Remote** | **JSR** | **NPM** |
|:--|:-:|:-:|:-:|
| **[Bun](https://bun.sh/)** >= v1.1.0 | ❌ | ✔️ | ✔️ |
| **[Deno](https://deno.land/)** >= v2.1.0 | ✔️ | ✔️ | ✔️ |
| **[NodeJS](https://nodejs.org/)** >= v20.9.0 | ❌ | ✔️ | ✔️ |

> [!NOTE]
> - It is possible to use this module in other methods/ways which not listed in here, however those methods/ways are not officially supported, and should beware maybe cause security issues.

### #️⃣ Resources Identifier

- **Remote - GitHub Raw:**
  ```
  https://raw.githubusercontent.com/hugoalh/blake-es/{Tag}/mod.ts
  ```
- **JSR:**
  ```
  [jsr:]@hugoalh/blake[@{Tag}]
  ```
- **NPM:**
  ```
  [npm:]@hugoalh/blake[@{Tag}]
  ```

> [!NOTE]
> - For usage of remote resources, it is recommended to import the entire module with the main path `mod.ts`, however it is also able to import part of the module with sub path if available, but do not import if:
>
>   - it's path has an underscore prefix (e.g.: `_foo.ts`, `_util/bar.ts`), or
>   - it is a benchmark or test file (e.g.: `foo.bench.ts`, `foo.test.ts`), or
>   - it's symbol has an underscore prefix (e.g.: `_bar`, `_foo`).
>
>   These elements are not considered part of the public API, thus no stability is guaranteed for them.
> - For usage of JSR or NPM resources, it is recommended to import the entire module with the main entrypoint, however it is also able to import part of the module with sub entrypoint if available, please visit the [file `jsr.jsonc`](./jsr.jsonc) property `exports` for available sub entrypoints.
> - It is recommended to use this module with tag for immutability.

### 🛡️ Runtime Permissions

*This module does not request any runtime permission.*

## 🧩 APIs

- ```ts
  class Blake2B {
    constructor(input?: Blake2BOptions);
    get freezed(): boolean;
    get length(): number;
    freeze(): this;
    hash(): Uint8Array;
    hashBase16(): string;
    hashBase32Hex(): string;
    hashBase36(): string;
    hashBigInt(): bigint;
    hashHex(): string;
    hashHexPadding(): string;
    hashUint8Array(): Uint8Array;
    update(data: Blake2AcceptDataType): this;
    updateFromStream(stream: ReadableStream<Blake2AcceptDataType>): Promise<this>;
  }
  ```
- ```ts
  class Blake2S {
    constructor(input?: Blake2Options);
    get freezed(): boolean;
    get length(): number;
    freeze(): this;
    hash(): Uint8Array;
    hashBase16(): string;
    hashBase32Hex(): string;
    hashBase36(): string;
    hashBigInt(): bigint;
    hashHex(): string;
    hashHexPadding(): string;
    hashUint8Array(): Uint8Array;
    update(data: Blake2AcceptDataType): this;
    updateFromStream(stream: ReadableStream<Blake2AcceptDataType>): Promise<this>;
  }
  ```
- ```ts
  interface Blake2Options {
    data?: Blake2AcceptDataType;
    key?: Uint8Array;
    length?: number;
  }
  ```
- ```ts
  interface Blake2BOptions extends Blake2Options {
    personal?: string | Uint8Array;
    salt?: string | Uint8Array;
  }
  ```
- ```ts
  type Blake2AcceptDataType =
    | string
    | Uint8Array;
  ```

> [!NOTE]
> - For the full or prettier documentation, can visit via:
>   - [Deno CLI `deno doc`](https://docs.deno.com/runtime/reference/cli/documentation_generator/)
>   - [JSR](https://jsr.io/@hugoalh/blake)

## ✍️ Examples

- ```ts
  new Blake2B("hello").hashHexPadding();
  //=> "28D19932"
  ```

# Blake (ES)

[**⚖️** MIT](./LICENSE.md)

[![GitHub: hugoalh/blake-es](https://img.shields.io/github/v/release/hugoalh/blake-es?label=hugoalh/blake-es&labelColor=181717&logo=github&logoColor=ffffff&sort=semver&style=flat "GitHub: hugoalh/blake-es")](https://github.com/hugoalh/blake-es)
[![JSR: @hugoalh/blake](https://img.shields.io/jsr/v/@hugoalh/blake?label=@hugoalh/blake&labelColor=F7DF1E&logo=jsr&logoColor=000000&style=flat "JSR: @hugoalh/blake")](https://jsr.io/@hugoalh/blake)
[![NPM: @hugoalh/blake](https://img.shields.io/npm/v/@hugoalh/blake?label=@hugoalh/blake&labelColor=CB3837&logo=npm&logoColor=ffffff&style=flat "NPM: @hugoalh/blake")](https://www.npmjs.com/package/@hugoalh/blake)

An ECMAScript module to get the non-cryptographic hash of the data with algorithm Blake.

## 🌟 Features

- Support custom output length.
- Support variants of 2B and 2S.

## 🎯 Targets

| **Runtime \\ Source** | **GitHub Raw** | **JSR** | **NPM** |
|:--|:-:|:-:|:-:|
| **[Bun](https://bun.sh/)** >= v1.1.0 | ❌ | ✔️ | ✔️ |
| **[Deno](https://deno.land/)** >= v2.1.0 | ✔️ | ✔️ | ✔️ |
| **[NodeJS](https://nodejs.org/)** >= v20.9.0 | ❌ | ✔️ | ✔️ |

## 🛡️ Runtime Permissions

This does not request any runtime permission.

## #️⃣ Sources

- GitHub Raw
  ```
  https://raw.githubusercontent.com/hugoalh/blake-es/{Tag}/mod.ts
  ```
- JSR
  ```
  jsr:@hugoalh/blake[@{Tag}]
  ```
- NPM
  ```
  npm:@hugoalh/blake[@{Tag}]
  ```

> [!NOTE]
> - It is recommended to include tag for immutability.
> - These are not part of the public APIs hence should not be used:
>   - Benchmark/Test file (e.g.: `example.bench.ts`, `example.test.ts`).
>   - Entrypoint name or path include any underscore prefix (e.g.: `_example.ts`, `foo/_example.ts`).
>   - Identifier/Namespace/Symbol include any underscore prefix (e.g.: `_example`, `Foo._example`).

## ⤵️ Entrypoints

| **Name** | **Path** | **Description** |
|:--|:--|:--|
| `.` | `./mod.ts` | Default. |
| `./2b` | `./2b.ts` | Variant of 2B. |
| `./2s` | `./2s.ts` | Variant of 2S. |

## 🧩 APIs

- ```ts
  class Blake2B {
    constructor(input?: Blake2BOptions);
    get freezed(): boolean;
    get length(): number;
    freeze(): this;
    hash(): Uint8Array;
    hashHex(): string;
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
    hashHex(): string;
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
>   - [Deno CLI `deno doc`](https://docs.deno.com/runtime/reference/cli/doc/)
>   - [JSR](https://jsr.io/@hugoalh/blake)

## ✍️ Examples

- ```ts
  new Blake2B("The quick brown fox jumps over the lazy dog").hashHex();
  //=> "A8ADD4BDDDFD93E4877D2746E62817B116364A1FA7BC148D95090BC7333B3673F82401CF7AA2E4CB1ECD90296E3F14CB5413F8ED77BE73045B13914CDCD6A918"
  ```

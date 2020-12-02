# fpk

Functional configuration management.

Use Typescript / Javascript to generate yaml, json, init (or register your own
format) configuration. Could be used for:

- Generating configuration for Kubernetes
- Generating configuration for databases
- etc.

## Why?

Functional programming and Typescript have some great traits, which are also
really beneficial when writing configuration:

- Composition - you can build your configuration like lego.
- Re-usability - create functions that define entire workloads and reuse them
  across projects.
- Type checking - intellisense FTW.

## Packages

| Name                         | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| [`@fpk/core`](packages/core) | Package that provides the config generation functionality       |
| [`@fpk/cli`](packages/cli)   | The CLI tool for generating configuration                       |
| [`@fpk/k8s`](packages/k8s)   | Collection of functions for generating Kubernetes configuration |

## Install

```
$ npm install -g @fpk/cli
$ fpk --help
```

## Kubernetes Example Project

See https://github.com/tim-smart/fpk-k8s-example

## Basic Usage

### Create some configuration

`src/my-app.ts`

```typescript
export default {
  "00-one": {
    key: "value",
  },

  "02-two": {
    foo: false,
  },

  "03-three.json": {
    json: true,
  },

  "04-four.ini": {
    ini: "yes",
  },
};
```

## Generate the output

```
$ fpk -d src -o out
MKDIR my-app/
CREATE my-app/00-one.yaml
CREATE my-app/02-two.yaml
CREATE my-app/03-three.json

$ tree out/
out
└── my-app
    ├── 00-one.yaml
    ├── 02-two.yaml
    ├── 03-three.json
    └── 04-four.ini

1 directory, 4 files

$ cat out/my-app/00-one.yaml
key: value
```

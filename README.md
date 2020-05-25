# fpk

Functional configuration management.

Use Typescript / Javascript to generate yaml or json configuration. Could be
used for:

- Generating configuration for Kubernetes
- Generating configuration for Terraform
- etc.

## Packages

| Name                         | Description                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| [`@fpk/core`](packages/core) | Package that provides the config generation functionality       |
| [`@fpk/cli`](packages/cli)   | The CLI tool for generating configuration                       |
| [`@fpk/k8s`](packages/k8s)   | Collection of functions for generating Kubernetes configuration |

## Install

npm install -g @fpk/cli

## Kubernetes Example Project

See https://github.com/tim-smart/fpk-k8s-example

## Usage

### Create some config

`src/my-app.ts`

```typescript
export default {
  "00-one": {
    key: "value",
  },

  "02-two": {
    foo: false,
  },
};
```

### Generate the output

```
$ fpk -d src -o out
MKDIR my-app/
CREATE my-app/00-one.yaml
CREATE my-app/02-two.yaml

$ tree out/
out
└── my-app
    ├── 00-one.yaml
    └── 02-two.yaml

1 directory, 2 files

$ cat out/my-app/00-one.yaml
key: value
```

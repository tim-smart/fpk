# @fpk/cli

Functional configuration management.

Use Typescript / Javascript to generate yaml or json configuration. Could be
used for:

- Generating configuration for Kubernetes
- Generating configuration for Terraform
- etc.

## Install

npm install -g @fpk/cli

## Create some config

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

## Generate the output

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

## Kubernetes Examples

See https://github.com/tim-smart/fpk-k8s-example

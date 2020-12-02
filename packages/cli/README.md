# @fpk/cli

Functional configuration management.

Use Typescript / Javascript to generate yaml, json or ini configuration. Could
be used for:

- Generating configuration for Kubernetes
- Generating configuration for databases
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

## Kubernetes Examples

See https://github.com/tim-smart/fpk-k8s-example

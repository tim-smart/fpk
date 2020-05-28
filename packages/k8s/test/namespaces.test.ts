import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";

describe("namespace", () =>
  runCases([
    {
      it: "creates a namespace",
      in: {},
      fn: (_) => K.namespace("myns"),
      diff: {
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: "myns",
        },
      },
    },

    {
      it: "merges in the second argument",
      in: K.namespace("myns"),
      fn: (_) =>
        K.namespace("myns", {
          metadata: {
            labels: { namespace: "myns" },
          },
        }),
      diff: {
        metadata: {
          labels: { namespace: "myns" },
        },
      },
    },
  ]));

describe("setNamespace", () =>
  runCases([
    {
      it: "updates metadata.namespace",
      in: K.deployment("myapp"),
      fn: K.setNamespace("myns"),
      diff: {
        metadata: {
          namespace: "myns",
        },
      },
    },
  ]));

describe("withNamespace", () =>
  runCases([
    {
      it: "creates a 00-namespace key",
      in: {},
      fn: K.withNamespace("myns"),
      diff: {
        "00-namespace": {
          apiVersion: "v1",
          kind: "Namespace",
          metadata: {
            name: "myns",
          },
        },
      },
    },

    {
      it: "modifies other values in object",
      in: async () => ({
        "10-deployment": K.deployment("myapp"),
        "20-promise-test": async () => ({
          key: "value",
        }),
      }),
      fn: K.withNamespace("myns"),
      diff: {
        "00-namespace": {
          apiVersion: "v1",
          kind: "Namespace",
          metadata: {
            name: "myns",
          },
        },
        "10-deployment": {
          metadata: {
            namespace: "myns",
          },
        },
        "20-promise-test": {
          metadata: {
            namespace: "myns",
          },
        },
      },
    },
  ]));

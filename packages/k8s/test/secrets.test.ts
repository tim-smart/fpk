import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";

describe("secret", () =>
  runCases([
    {
      it: "creates a secret",
      in: {},
      fn: (_) =>
        K.secret(
          "myconfig",
          {
            key: "value",
          },
          { metadata: { labels: { test: "ing" } } },
        ),
      diff: {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "myconfig",
          labels: {
            test: "ing",
          },
        },
        data: {
          key: "dmFsdWU=",
        },
      },
    },
  ]));

describe("secretFromFile", () =>
  runCases([
    {
      it: "creates a secret from a file",
      in: K.secret("myconfig", {}),
      fn: (_) => K.secretFromFile("myconfig", "test/fixtures/file.txt"),
      diff: {
        data: {
          "file.txt": "YXNkZgo=",
        },
      },
    },
  ]));

describe("secretFromDir", () =>
  runCases([
    {
      it: "creates a secret from a directory",
      in: K.secret("myconfig", {}),
      fn: (_) => K.secretFromDir("myconfig", "test/fixtures/"),
      diff: {
        data: {
          "file.txt": "YXNkZgo=",
        },
      },
    },
  ]));

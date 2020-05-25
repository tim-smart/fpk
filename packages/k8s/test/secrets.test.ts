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

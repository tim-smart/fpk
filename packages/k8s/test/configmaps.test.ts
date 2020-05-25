import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";

describe("configmap", () =>
  runCases([
    {
      it: "creates a configmap",
      in: {},
      fn: (_) =>
        K.configmap(
          "myconfig",
          {
            key: "value",
          },
          { metadata: { labels: { test: "ing" } } },
        ),
      diff: {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
          name: "myconfig",
          labels: {
            test: "ing",
          },
        },
        data: {
          key: "value",
        },
      },
    },
  ]));

describe("configmapFromFile", () =>
  runCases([
    {
      it: "creates a configmap from a file",
      in: K.configmap("myconfig", {}),
      fn: (_) => K.configmapFromFile("myconfig", "test/fixtures/file.txt"),
      diff: {
        data: {
          "file.txt": "asdf\n",
        },
      },
    },
  ]));

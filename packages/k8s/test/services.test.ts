import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";

describe("service", () =>
  runCases([
    {
      it: "creates a service resource",
      in: {},
      fn: (_) =>
        K.service(
          "mysvc",
          { app: "myapp" },
          { metadata: { labels: { test: "ing" } } },
        ),
      diff: {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: "mysvc",
          labels: {
            test: "ing",
          },
        },
        spec: {
          selector: {
            app: "myapp",
          },
        },
      },
    },
  ]));

describe("serviceWithPort", () =>
  runCases([
    {
      it: "creates a service resource with a port",
      in: K.service(
        "mysvc",
        { app: "myapp" },
        { metadata: { labels: { test: "ing" } } },
      ),
      fn: (_) =>
        K.serviceWithPort("mysvc", { app: "myapp" }, 3000, {
          metadata: { labels: { test: "ing" } },
        }),
      diff: {
        spec: {
          ports: [{ port: 3000, targetPort: 3000 }],
        },
      },
    },
  ]));

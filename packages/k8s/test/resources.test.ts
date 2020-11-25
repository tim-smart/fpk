import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { CrossVersionObjectReference } from "kubernetes-types/autoscaling/v2beta2";
import { Deployment } from "kubernetes-types/apps/v1";

describe("label", () =>
  runCases([
    {
      it: "adds to metadata.labels",
      in: K.deployment("myapp"),
      fn: K.label("mylabel", "value"),
      diff: {
        metadata: {
          labels: {
            mylabel: "value",
          },
        },
      },
    },
  ]));

describe("annotate", () =>
  runCases([
    {
      it: "adds to metadata.annotations",
      in: K.deployment("myapp"),
      fn: K.annotate("myannotation", "value"),
      diff: {
        metadata: {
          annotations: {
            myannotation: "value",
          },
        },
      },
    },
  ]));

describe("objectRef", () =>
  runCases([
    {
      it: "returns a CrossVersionObjectReference",
      in: {},
      fn: () => K.objectRef(K.deployment("myapp")),
      diff: {
        apiVersion: "apps/v1",
        kind: "Deployment",
        name: "myapp",
      } as CrossVersionObjectReference,
    },
  ]));

describe("matches", () =>
  runCases([
    {
      it: "returns true if the resource matches",
      in: K.deployment("deploy"),
      fn: K.matches("Deployment", "deploy"),
      diff: true,
    },
    {
      it: "returns false if the resource does not match",
      in: K.job("myjob"),
      fn: K.matches("Deployment", "deploy"),
      diff: false,
    },
  ]));

describe("overResource", () =>
  runCases([
    {
      it: "updates the correct resource in the object",
      in: K.withNamespace("myns")({
        "10-config": K.configMap("mycm", {
          key: "value",
        }),
        "20-deploy": K.deployment("mydeploy"),
        "20-deploytwo": K.deployment("mydeploy2"),
      }),
      fn: K.overResource<Deployment>(
        "Deployment",
        "mydeploy2",
      )(K.annotate("key", "value")),
      diff: {
        "20-deploytwo": {
          metadata: {
            annotations: {
              key: "value",
            },
          },
        } as Deployment,
      },
    },
    {
      it: "can have the name parameter omitted",
      in: K.withNamespace("myns")({
        "10-config": K.configMap("mycm", {
          key: "value",
        }),
        "20-deploy": K.deployment("mydeploy"),
        "20-deploytwo": K.deployment("mydeploy2"),
      }),
      fn: K.overResource<Deployment>("Deployment")(K.annotate("key", "value")),
      diff: {
        "20-deploy": {
          metadata: {
            annotations: {
              key: "value",
            },
          },
        } as Deployment,
        "20-deploytwo": {
          metadata: {
            annotations: {
              key: "value",
            },
          },
        } as Deployment,
      },
    },
  ]));

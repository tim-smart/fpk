import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import * as R from "ramda";

describe("overPodTemplate", () =>
  runCases([
    {
      it: "runs the fn over the pod template in the deployment",
      in: K.deployment("myapp"),
      fn: K.overPodTemplate(R.set(R.lensPath(["metadata", "name"]), "changed")),
      diff: {
        spec: {
          template: {
            metadata: {
              name: "changed",
            },
          },
        },
      },
    },

    // TODO: Add case for daemonSet, cronjob etc.
  ]));

describe("concatContainers", () =>
  runCases([
    {
      it: "adds a list of containers",
      in: K.deployment("myapp"),
      fn: K.concatContainers([{ name: "container1" }, { name: "container2" }]),
      diff: {
        spec: {
          template: {
            spec: {
              containers: {
                "0": { name: "container1" },
                "1": { name: "container2" },
              },
            },
          },
        },
      },
    },
  ]));

describe("appendContainer", () =>
  runCases([
    {
      it: "adds a container",
      in: K.deployment("myapp"),
      fn: K.appendContainer({ name: "container1" }),
      diff: {
        spec: {
          template: {
            spec: {
              containers: {
                "0": { name: "container1" },
              },
            },
          },
        },
      },
    },
  ]));

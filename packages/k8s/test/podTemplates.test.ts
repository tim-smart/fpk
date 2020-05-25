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

describe("overContainers", () =>
  runCases([
    {
      it: "runs the function over the containers",
      in: K.deployment("myapp"),
      fn: K.overContainers(R.append({ name: "container1" })),
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

describe("overContainer", () =>
  runCases([
    {
      it: "runs the function over the specified container",
      in: R.pipe(
        K.appendContainer({
          name: "secondcontainer",
          image: "anotherimage",
        }),
      )(
        K.deploymentWithContainer({
          name: "myapp",
          image: "myimage",
        }),
      ),
      fn: K.overContainer(
        "myapp",
        K.concatEnv({
          FOO: "bar",
        }),
      ),
      diff: {
        spec: {
          template: {
            spec: {
              containers: {
                "0": {
                  env: { "0": { name: "FOO", value: "bar" } },
                },
              },
            },
          },
        },
      },
    },
  ]));

describe("setResourceRequests", () =>
  runCases([
    {
      it: "sets the resource requests for the correct container",
      in: K.deploymentWithContainer({
        name: "myapp",
        image: "myimage",
      }),
      fn: K.setResourceRequests("myapp", { cpu: "1", memory: "100M" }),
      diff: {
        spec: {
          template: {
            spec: {
              containers: {
                "0": {
                  resources: {
                    requests: {
                      cpu: "1",
                      memory: "100M",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  ]));

describe("setResourceLimits", () =>
  runCases([
    {
      it: "sets the resource limits for the correct container",
      in: K.deploymentWithContainer({
        name: "myapp",
        image: "myimage",
      }),
      fn: K.setResourceLimits("myapp", { cpu: "1", memory: "100M" }),
      diff: {
        spec: {
          template: {
            spec: {
              containers: {
                "0": {
                  resources: {
                    limits: {
                      cpu: "1",
                      memory: "100M",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  ]));

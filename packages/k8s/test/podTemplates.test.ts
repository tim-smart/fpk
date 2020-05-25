import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import * as R from "ramda";
import { Container } from "kubernetes-types/core/v1";

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
                  env: [{ name: "FOO", value: "bar" }],
                },
              },
            },
          },
        },
      },
    },
  ]));

describe("appendVolume", () =>
  runCases([
    {
      it: "appends a volume to the pod template",
      in: K.deploymentWithContainer({
        name: "myapp",
        image: "myimage",
      }),
      fn: K.appendVolume("myvolume", {
        persistentVolumeClaim: { claimName: "myclaim" },
      }),
      diff: {
        spec: {
          template: {
            spec: {
              volumes: [
                {
                  name: "myvolume",
                  persistentVolumeClaim: {
                    claimName: "myclaim",
                  },
                },
              ],
            },
          },
        },
      },
    },
  ]));

describe("appendVolumeAndMount", () =>
  runCases([
    {
      it: "appends a volume to the pod template and mounts it to the container",
      in: K.deploymentWithContainer({
        name: "myapp",
        image: "myimage",
      }),
      fn: K.appendVolumeAndMount({
        name: "myvolume",
        volume: {
          persistentVolumeClaim: { claimName: "myclaim" },
        },
        containerName: "myapp",
        mountPath: "/mnt/volume",
      }),
      diff: {
        spec: {
          template: {
            spec: {
              containers: {
                "0": {
                  volumeMounts: [
                    {
                      name: "myvolume",
                      mountPath: "/mnt/volume",
                    },
                  ],
                },
              },
              volumes: [
                {
                  name: "myvolume",
                  persistentVolumeClaim: {
                    claimName: "myclaim",
                  },
                },
              ],
            },
          },
        },
      },
    },
  ]));

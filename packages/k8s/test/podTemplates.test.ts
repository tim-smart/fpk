import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import * as R from "ramda";
import { PodTemplateSpec } from "kubernetes-types/core/v1";
import { Deployment } from "kubernetes-types/apps/v1";

describe("getPodTemplate", () =>
  runCases([
    {
      it: "gets the pod template in the deployment",
      in: {},
      fn: () => K.viewPodTemplate(K.deployment("myapp")),
      diff: {
        metadata: { labels: { app: "myapp" } },
        spec: { containers: [] },
      } as PodTemplateSpec,
    },
  ]));

describe("getPodPath", () =>
  runCases([
    {
      it: "gets at the path for the deployment",
      in: {},
      fn: () => K.viewPodPath(["spec"])(K.deployment("myapp")),
      diff: { containers: [] },
    },
  ]));

describe("getPodLabels", () =>
  runCases([
    {
      it: "gets the pod template labels for the deployment",
      in: {},
      fn: () => K.viewPodLabels(K.deployment("myapp")),
      diff: { app: "myapp" },
    },
  ]));

describe("getPodAnnotations", () =>
  runCases([
    {
      it: "gets the pod template annotations for the deployment",
      in: {},
      fn: () =>
        K.viewPodAnnotations(
          K.deployment("myapp", {
            spec: { template: { metadata: { annotations: { foo: "bar" } } } },
          }),
        ),
      diff: { foo: "bar" },
    },
  ]));

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

describe("concatInitContainers", () =>
  runCases([
    {
      it: "adds a list of init containers",
      in: K.deployment("myapp"),
      fn: K.concatInitContainers([
        { name: "container1" },
        { name: "container2" },
      ]),
      diff: {
        spec: {
          template: {
            spec: {
              initContainers: [{ name: "container1" }, { name: "container2" }],
            },
          },
        },
      },
    },
  ]));

describe("appendInitContainer", () =>
  runCases([
    {
      it: "adds an init container",
      in: K.deployment("myapp"),
      fn: K.appendInitContainer({ name: "container1" }),
      diff: {
        spec: {
          template: {
            spec: {
              initContainers: [{ name: "container1" }],
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

describe("overFirstContainer", () =>
  runCases([
    {
      it: "runs the function over the first container",
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
      fn: K.overFirstContainer(
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

describe("overInitContainer", () =>
  runCases([
    {
      it: "runs the function over the specified init container",
      in: K.appendInitContainer({
        name: "mycontainer",
        image: "anotherimage",
      })(K.deployment("myapp")),
      fn: K.overInitContainer(
        "mycontainer",
        K.concatEnv({
          FOO: "bar",
        }),
      ),
      diff: {
        spec: {
          template: {
            spec: {
              initContainers: {
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

describe("overFirstInitContainer", () =>
  runCases([
    {
      it: "runs the function over the specified init container",
      in: R.pipe(
        K.appendInitContainer({
          name: "mycontainer",
          image: "anotherimage",
        }),
        K.appendInitContainer({
          name: "mycontainer2",
          image: "anotherimage",
        }),
      )(K.deployment("myapp")),
      fn: K.overFirstInitContainer(
        K.concatEnv({
          FOO: "bar",
        }),
      ),
      diff: {
        spec: {
          template: {
            spec: {
              initContainers: {
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
      fn: K.appendVolume({
        name: "myvolume",
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
        volume: {
          name: "myvolume",
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

describe("setRestartPolicy", () =>
  runCases([
    {
      it: "sets the restartPolicy for the pod template",
      in: K.deployment("myapp"),
      fn: K.setRestartPolicy("OnFailure"),
      diff: {
        spec: {
          template: {
            spec: {
              restartPolicy: "OnFailure",
            },
          },
        },
      } as Deployment,
    },
  ]));

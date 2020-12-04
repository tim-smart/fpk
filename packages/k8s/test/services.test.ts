import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { Service, ServiceSpec } from "kubernetes-types/core/v1";

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

describe("appendServicePort", () =>
  runCases([
    {
      it: "appends the port to the service",
      in: K.service("mysvc", { app: "myapp" }),
      fn: K.appendServicePort("http", 80),
      diff: {
        spec: { ports: [{ name: "http", port: 80, targetPort: 80 }] },
      } as Service,
    },
  ]));

describe("serviceWithPorts", () =>
  runCases([
    {
      it: "creates a service resource with a port",
      in: K.service(
        "mysvc",
        { app: "myapp" },
        { metadata: { labels: { test: "ing" } } },
      ),
      fn: (_) =>
        K.serviceWithPorts(
          "mysvc",
          { app: "myapp" },
          { http: 3000 },
          {
            metadata: { labels: { test: "ing" } },
          },
        ),
      diff: {
        spec: {
          ports: [{ name: "http", port: 3000, targetPort: 3000 }],
        },
      },
    },
  ]));

describe("serviceFromPod", () =>
  runCases([
    {
      it: "creates a service resource from a deployment",
      in: K.service("mysvc", {}),
      fn: (_) =>
        K.serviceFromPod(
          "mysvc",
          K.deploymentWithContainer(
            "mydeploy",
            K.containerWithPorts("myapp", "myimage", {
              http: 3000,
              admin: 1337,
            }),
          ),
        ),
      diff: {
        spec: {
          selector: {
            app: "mydeploy",
          },
          ports: [
            { name: "http", port: 3000, targetPort: 3000 },
            { name: "admin", port: 1337, targetPort: 1337 },
          ],
        } as ServiceSpec,
      },
    },
  ]));

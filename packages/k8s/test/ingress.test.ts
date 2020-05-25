import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { Ingress } from "kubernetes-types/networking/v1beta1";

describe("ingress", () =>
  runCases([
    {
      it: "creates an ingress resource",
      in: {},
      fn: (_) =>
        K.ingress("myingress", {
          rules: [
            {
              host: "example.com",
              http: {
                paths: [
                  {
                    backend: {
                      serviceName: "myapp",
                      servicePort: 3000,
                    },
                  },
                ],
              },
            },
          ],
          tls: [
            {
              hosts: ["example.com"],
              secretName: "myapp-tls-secret",
            },
          ],
        }),
      diff: {
        apiVersion: "networking.k8s.io/v1beta1",
        kind: "Ingress",
        metadata: {
          name: "myingress",
        },
        spec: {
          rules: [
            {
              host: "example.com",
              http: {
                paths: [
                  {
                    backend: {
                      serviceName: "myapp",
                      servicePort: 3000,
                    },
                  },
                ],
              },
            },
          ],
          tls: [
            {
              hosts: ["example.com"],
              secretName: "myapp-tls-secret",
            },
          ],
        },
      },
    },
  ]));

describe("ingressFromRules", () =>
  runCases([
    {
      it: "creates an ingress resource from rules",
      in: {},
      fn: (_) =>
        K.ingressFromRules("myingress", {
          tlsAcme: true,
          tlsRedirect: true,
          tlsSecretName: "myapp-tls-secret",
          backend: {
            serviceName: "myapp",
            servicePort: 3000,
          },
          rules: [
            { host: "simple.example.com" },
            {
              host: "example.com",
              paths: [
                {
                  path: "/",
                },
                {
                  path: "/b",
                  backend: {
                    serviceName: "myapp2",
                    servicePort: 4000,
                  },
                },
              ],
            },
          ],
        }),
      diff: {
        apiVersion: "networking.k8s.io/v1beta1",
        kind: "Ingress",
        metadata: {
          name: "myingress",
          annotations: {
            "ingress.kubernetes.io/force-ssl-redirect": "true",
            "kubernetes.io/tls-acme": "true",
          },
        },
        spec: {
          rules: [
            {
              host: "simple.example.com",
              http: {
                paths: [
                  {
                    backend: {
                      serviceName: "myapp",
                      servicePort: 3000,
                    },
                  },
                ],
              },
            },
            {
              host: "example.com",
              http: {
                paths: [
                  {
                    path: "/",
                    backend: {
                      serviceName: "myapp",
                      servicePort: 3000,
                    },
                  },
                  {
                    path: "/b",
                    backend: {
                      serviceName: "myapp2",
                      servicePort: 4000,
                    },
                  },
                ],
              },
            },
          ],
          tls: [
            {
              hosts: ["simple.example.com", "example.com"],
              secretName: "myapp-tls-secret",
            },
          ],
        },
      } as Ingress,
    },
  ]));

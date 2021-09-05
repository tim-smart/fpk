import * as K from "../src/index";
import { describe } from "mocha";
import { runCases } from "./helpers";
import { Ingress } from "kubernetes-types/networking/v1";

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
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "myapp",
                        port: { number: 3000 },
                      },
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
        apiVersion: "networking.k8s.io/v1",
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
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "myapp",
                        port: { number: 3000 },
                      },
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

describe("ingressSimple", () =>
  runCases([
    {
      it: "creates an ingress resource from rules",
      in: {},
      fn: (_) =>
        K.ingressSimple("myingress", {
          tlsAcme: true,
          tlsRedirect: true,
          tlsSecretName: "myapp-tls-secret",
          backend: {
            service: {
              name: "myapp",
              port: { number: 3000 },
            },
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
                    service: {
                      name: "myapp2",
                      port: { number: 4000 },
                    },
                  },
                },
              ],
            },
          ],
        }),
      diff: {
        apiVersion: "networking.k8s.io/v1",
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
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "myapp",
                        port: { number: 3000 },
                      },
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
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "myapp",
                        port: { number: 3000 },
                      },
                    },
                  },
                  {
                    path: "/b",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "myapp2",
                        port: { number: 4000 },
                      },
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

describe("ingressFromService", () =>
  runCases([
    {
      it: "creates an ingress resource from a service",
      in: K.ingress("myingress", {}),
      fn: (_) =>
        K.ingressFromService(
          "myingress",
          ["example.com", "foo.example.com"],
          K.serviceWithPorts("myapp", {}, { http: 1337 }),
        ),
      diff: {
        metadata: {
          annotations: {
            "ingress.kubernetes.io/force-ssl-redirect": "true",
            "kubernetes.io/tls-acme": "true",
          },
        },
        spec: {
          rules: [
            {
              host: "example.com",
              http: {
                paths: [
                  {
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "myapp",
                        port: { number: 1337 },
                      },
                    },
                  },
                ],
              },
            },
            {
              host: "foo.example.com",
              http: {
                paths: [
                  {
                    path: "/",
                    pathType: "Prefix",
                    backend: {
                      service: {
                        name: "myapp",
                        port: { number: 1337 },
                      },
                    },
                  },
                ],
              },
            },
          ],
          tls: [
            {
              hosts: ["example.com", "foo.example.com"],
              secretName: "myingress-tls",
            },
          ],
        },
      } as Ingress,
    },
  ]));

describe("setBasicAuth", () =>
  runCases([
    {
      it: "annotates the ingress for basic auth",
      in: K.ingress("myingress", {}),
      fn: K.setBasicAuth("mysecret"),
      diff: {
        metadata: {
          annotations: {
            "ingress.kubernetes.io/auth-type": "basic",
            "ingress.kubernetes.io/auth-secret": "mysecret",
          },
        },
      } as Ingress,
    },
  ]));

describe("setIngressClass", () =>
  runCases([
    {
      it: "annotates the ingress with a class",
      in: K.ingress("myingress", {}),
      fn: K.setIngressClass("gcp"),
      diff: {
        metadata: {
          annotations: {
            "kubernetes.io/ingress.class": "gcp",
          },
        },
      } as Ingress,
    },
  ]));

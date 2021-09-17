import * as F from "fp-ts/function";
import {
  Ingress,
  IngressSpec,
  IngressBackend,
  IngressRule,
  HTTPIngressPath,
} from "kubernetes-types/networking/v1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { annotate, maybeMergeResource, resource } from "./resources";
import { Service } from "kubernetes-types/core/v1";

export const ingress = (
  name: string,
  spec: IngressSpec,
  toMerge?: DeepPartial<Ingress>,
): Ingress =>
  maybeMergeResource<Ingress>(
    resource<Ingress>("networking.k8s.io/v1", "Ingress", name, { spec }),
    toMerge,
  );

export interface IIngressRules {
  backend: IngressBackend;
  rules: IIngressRule[];

  tlsAcme?: boolean;
  tlsSecretName?: string;
  tlsRedirect?: boolean;
}

export interface IIngressRule {
  host: string;
  paths?: IIngressRulePath[];
}

export interface IIngressRulePath {
  path: string;
  backend?: IngressBackend;
}

export type TIngressSpecTransformer = (i: IngressSpec) => IngressSpec;

const rulesToSpec = ({
  backend,
  rules,
  tlsSecretName,
}: IIngressRules): IngressSpec =>
  F.pipe(
    {
      rules: R.map(
        ({ host, paths }): IngressRule => ({
          host,
          http: {
            paths: R.ifElse(
              R.isNil,
              () => [{ path: "/", pathType: "Prefix", backend }],
              R.map(
                ({
                  path,
                  backend: pathBackend,
                }: IIngressRulePath): HTTPIngressPath => ({
                  path,
                  pathType: "Prefix",
                  backend: pathBackend || backend,
                }),
              ),
            )(paths),
          },
        }),
        rules,
      ),
    } as IngressSpec,

    R.when(
      () => !R.isNil(tlsSecretName),
      R.set(R.lensProp("tls"), [
        {
          hosts: R.map((rule) => rule.host, rules),
          secretName: tlsSecretName,
        },
      ]),
    ),
  );

/**
 * Create an ingress with a simplier API
 */
export const ingressSimple = (
  name: string,
  rules: IIngressRules,
  toMerge?: DeepPartial<Ingress>,
) =>
  F.pipe(
    ingress(name, rulesToSpec(rules), toMerge),

    R.when<Ingress, Ingress>(
      () => rules.tlsAcme === true,
      annotate("kubernetes.io/tls-acme", "true"),
    ),

    R.when<Ingress, Ingress>(
      () => rules.tlsRedirect === true,
      annotate("ingress.kubernetes.io/force-ssl-redirect", "true"),
    ),
  );

/**
 * Create an ingress from a Service
 */
export const ingressFromService = (
  name: string,
  hosts: string[],
  svc: Service,
  tls = true,
) =>
  ingressSimple(name, {
    backend: {
      service: {
        name: svc.metadata!.name!,
        port: { number: svc.spec!.ports![0].port },
      },
    },
    tlsRedirect: tls,
    tlsAcme: tls,
    tlsSecretName: `${name}-tls`,
    rules: R.map((host) => ({ host }), hosts),
  });

/**
 * Returns a function that sets basic auth annotations on the ingress.
 */
export const setBasicAuth = (secretName: string): ((i: Ingress) => Ingress) =>
  F.flow(
    annotate("ingress.kubernetes.io/auth-type", "basic"),
    annotate("ingress.kubernetes.io/auth-secret", secretName),
  );

/**
 * Returns a function that sets the ingress class annotation.
 */
export const setIngressClass = (
  ingressClass: string,
): ((i: Ingress) => Ingress) =>
  R.assocPath(["spec", "ingressClassName"], ingressClass);

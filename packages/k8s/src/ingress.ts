import {
  Ingress,
  IngressSpec,
  IngressBackend,
  IngressRule,
} from "kubernetes-types/networking/v1beta1";
import * as R from "ramda";
import { DeepPartial } from "./common";
import { annotate, maybeMergeResource, resource } from "./resources";
import { Service } from "kubernetes-types/core/v1";

export const ingress = (
  name: string,
  spec: IngressSpec,
  toMerge?: DeepPartial<Ingress>,
) =>
  maybeMergeResource<Ingress>(
    resource<Ingress>("networking.k8s.io/v1beta1", "Ingress", name, { spec }),
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

type IngressSpecTransformer = (i: IngressSpec) => IngressSpec;

const rulesToSpec = ({
  backend,
  rules,
  tlsSecretName,
}: IIngressRules): IngressSpec => {
  const ingress: IngressSpec = {
    rules: R.map(
      ({ host, paths }): IngressRule => ({
        host,
        http: {
          paths: R.ifElse(
            R.isNil,
            () => [{ backend }],
            R.map(({ path, backend: pathBackend }: IIngressRulePath) => ({
              path,
              backend: pathBackend || backend,
            })),
          )(paths),
        },
      }),
      rules,
    ),
  };

  return R.pipe(
    R.when<IngressSpec, IngressSpec>(
      () => !R.isNil(tlsSecretName),
      R.set(R.lensProp("tls"), [
        {
          hosts: R.map((rule) => rule.host, rules),
          secretName: tlsSecretName,
        },
      ]),
    ),
  )(ingress);
};

/**
 * Create an ingress with a simplier API
 */
export const ingressSimple = (
  name: string,
  rules: IIngressRules,
  toMerge?: DeepPartial<Ingress>,
) =>
  R.pipe(
    R.when<Ingress, Ingress>(
      () => rules.tlsAcme === true,
      annotate("kubernetes.io/tls-acme", "true"),
    ),

    R.when<Ingress, Ingress>(
      () => rules.tlsRedirect === true,
      annotate("ingress.kubernetes.io/force-ssl-redirect", "true"),
    ),
  )(ingress(name, rulesToSpec(rules), toMerge));

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
      serviceName: svc.metadata!.name!,
      servicePort: svc.spec!.ports![0].port,
    },
    tlsRedirect: tls,
    tlsAcme: tls,
    tlsSecretName: `${name}-tls`,
    rules: R.map((host) => ({ host }), hosts),
  });

/**
 * Returns a function that sets basic auth annotations on the ingress.
 */
export const setBasicAuth = (secretName: string) =>
  R.pipe<Ingress, Ingress, Ingress>(
    annotate("ingress.kubernetes.io/auth-type", "basic"),
    annotate("ingress.kubernetes.io/auth-secret", secretName),
  );

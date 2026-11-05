export const adminOnlyDescribe = Cypress.env('NON_PRIV') ? xdescribe : describe;
export const adminOnlyIT = Cypress.env('NON_PRIV') ? xit : it;

export const TEST_NS = Cypress.env('TEST_NS') || 'cy-test-ns';
export const NAD_NS = Cypress.env('NAD_NS') || 'nad-test-ns';
export const UDN_NS = Cypress.env('UDN_NS') || 'udn-test-ns';
export const EMPTY_NS = Cypress.env('EMPTY_NS') || 'empty-test-ns';
export const CUDN_NS = Cypress.env('CUDN_NS') || 'cudn-test-ns';
export const TOPO_NS = Cypress.env('TOPO_NS') || 'topo-test-ns';
export const LOCALNET_NS = Cypress.env('LOCALNET_NS') || 'localnet-test-ns';

export const EXAMPLE = 'example';
export const ALL_PROJ_NS = 'All Projects';
export const TEST_ROUTE_NAME = 'auto-test-route';
export const TEST_POL_NAME = 'auto-test-net-policy';
export const TEST_MULTI_NAME = 'auto-test-multi-policy';

export const SECOND = 1000;
export const MINUTE = 60000;

export const UDN_LABEL = 'k8s.ovn.org/primary-user-defined-network';
export const CUDN_MEMBER_LABEL = 'e2e.networking-console-plugin/cudn';
export const CUDN_31_MEMBER_LABEL = 'e2e.networking-console-plugin/cudn-31';
export const LOCALNET_MEMBER_LABEL = 'e2e.networking-console-plugin/localnet';

export enum K8S_KIND {
  CUDN = 'ClusterUserDefinedNetwork',
  NAD = 'net-attach-def',
  Project = 'project',
  UDN = 'UserDefinedNetwork',
}

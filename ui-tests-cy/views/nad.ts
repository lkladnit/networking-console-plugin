import { NadData } from '../utils/types/nad';

import { row } from './selector-common';

export const name = 'input[name="name"]';
export const description = 'input[name="description"]';
export const type = '#toggle-nads-network-type';
export const cnvBridgeLink = '[data-test-dropdown-menu="cnv-bridge"]';
export const ovnNetwork = 'button[id="ovn-k8s-cni-overlay-link"]';
export const localnet = 'button[id="ovn-k8s-cni-overlay-localnet-link"]';
export const bridgeName = 'input[name="bridge.bridge"]';
export const bridgeVlan = 'input[name="bridge.vlanTagNum"]';
export const bridgeMap =
  '#nads-ovn-physical-network-name, [data-test="nads-ovn-physical-network-name"], input[name*="bridgeMapping"]';
export const bridgeMTU = 'input[name="ovn-k8s-cni-overlay-localnet.mtu"]';
export const localnetVlan = 'input[name="ovn-k8s-cni-overlay-localnet.vlanID"]';
export const confirmBtn = '[data-test="confirm-action"]';
// The generic console details page exposes the resource name as h1[data-test="resource-title"];
// our plugin's page renders the same name in its h1. Assert on the name instead of a
// plugin-specific section heading that does not exist on the generic page.
export const heading = 'h1';
export const createBtn = '#save-changes';
export const macSpoofCHK = 'input[id="bridge.macspoofchk"]';
export const ovnSubnet = 'input[name="ovn-k8s-cni-overlay.subnets"]';
export const localnetSubnet = 'input[name="ovn-k8s-cni-overlay-localnet.subnets"]';
export const exclude = 'input[name="ovn-k8s-cni-overlay-localnet.excludeSubnets"]';

export const createNAD = (nad: NadData) => {
  cy.visitNAD();
  cy.byButtonText('Create NetworkAttachmentDefinition').click();
  cy.get('#form').check();
  cy.get(name, { timeout: 10000 }).should('be.visible');
  cy.get(name).clear();
  cy.get(name).type(nad.name);
  cy.get(type).click();
  switch (nad.type) {
    case 'Bridge': {
      cy.byButtonText('Linux bridge').click();
      cy.get(bridgeName).clear();
      cy.get(bridgeName).type(nad.bridge);
      if (nad.vlan) {
        cy.get(bridgeVlan).clear();
        cy.get(bridgeVlan).type(nad.vlan);
      }
      if (!nad.macSpoof) {
        cy.get(macSpoofCHK).uncheck();
      }
      break;
    }
    case 'OVN': {
      cy.byButtonText('L2 overlay').click();
      if (nad.subnet) {
        cy.get(ovnSubnet).type(nad.subnet);
      }
      break;
    }
    case 'Localnet': {
      cy.byButtonText('secondary localnet').click();
      cy.get(bridgeMap).clear();
      cy.get(bridgeMap).type(nad.bridge);
      cy.get(bridgeMTU).clear();
      cy.get(bridgeMTU).type(nad.mtu);
      if (nad.vlan) {
        cy.get(localnetVlan).clear();
        cy.get(localnetVlan).type(nad.vlan);
      }
      if (nad.subnet) {
        cy.get(localnetSubnet).type(nad.subnet);
        cy.get(exclude).type(nad.exclude);
      }
      break;
    }
  }
  cy.get(createBtn).click();
  cy.contains(heading, nad.name).should('exist');
};

export const deleteNAD = (nadName: string) => {
  cy.contains(row, nadName).find('.pf-v6-c-table__action').find('button').click();
  cy.byButtonText('Delete').click();
  cy.get(confirmBtn).click();
  cy.contains(row, nadName).should('not.exist');
};

/**
 * Run the body unless the deployed NAD form lacks the given network type.
 * The generic console form only offers Linux bridge; OVN and secondary-localnet
 * options come from networking-console-plugin. Call inside `it(..., function () {...})`
 * so the Mocha context is available for ctx.skip().
 */
export const withNetworkType = (
  option: string,
  ctx: Mocha.Context,
  body: () => void,
): void => {
  cy.get(type).click();
  cy.get('body').then(($body) => {
    const available = $body
      .find('[role="option"]')
      .filter(`:contains(${JSON.stringify(option)})`).length;
    if (!available) {
      cy.log(`Network type "${option}" not available — skipping (plugin not deployed)`);
      ctx.skip();
    }
  });
  cy.contains('[role="option"]', option).click();
  body();
};

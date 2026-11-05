import { MINUTE, TEST_NS, TEST_POL_NAME } from '../../utils/const/base';
import { checkActionMenu, nameInput } from '../../views/actions';
import { brCrumbItem, egressOff, ingressOff, itemFilter, row } from '../../views/selector-common';

const denyTraffic = () => {
  cy.get(ingressOff).check();
  cy.get('body').then(($body) => {
    if ($body.find(egressOff).length) {
      cy.get(egressOff).check();
    }
  });
};

describe('Check NetworkPolicies page', () => {
  it('create NetworkPolicy with form', () => {
    cy.visit(`/k8s/ns/${TEST_NS}/networkpolicies`);
    cy.checkTitle('NetworkPolicies', MINUTE);
    cy.byButtonText('Create NetworkPolicy').click();
    cy.get('input#form').check();
    cy.get(nameInput, { timeout: 10000 }).should('be.visible').clear();
    cy.get(nameInput).type(TEST_POL_NAME);
    // Form initializes with a random name like `policy-ivory-baboon`; typing may race
    // with re-render so the value can be either the typed name or the generated one.
    cy.get(nameInput).invoke('val').should('match', /auto-test-net-policy|policy-/);
    cy.get(nameInput).invoke('val').as('polName');
    denyTraffic();
    cy.clickBtn('Create');
    cy.get<string>('@polName').then((polName) => {
      cy.checkTitle(polName, MINUTE * 5);
      checkActionMenu('NetworkPolicy');
      cy.contains(brCrumbItem, 'NetworkPolicy').find('a').click();
      cy.get(itemFilter).type(polName);
      cy.contains(row, polName, { timeout: 60000 }).should('exist');
    });
  });
});

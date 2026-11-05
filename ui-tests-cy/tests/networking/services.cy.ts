import { EXAMPLE, MINUTE, TEST_NS } from '../../utils/const/base';
import { checkActionMenu } from '../../views/actions';
import { createBtn } from '../../views/nad';
import { brCrumbItem, itemFilter, row } from '../../views/selector-common';

describe('Check Services page', () => {
  // https://redhat.atlassian.net/browse/OCPNETUI-230
  it('create Service with YAML', () => {
    cy.visit(`/k8s/ns/${TEST_NS}/services`);
    cy.checkTitle('Services', MINUTE);
    cy.byButtonText('Create Service').click();
    cy.get('#yaml').check();
    // Editor can mount before the YAML template loads; wait for actual content
    // or Create submits empty YAML ("No YAML content found").
    cy.get('.yaml-editor .view-line', { timeout: 30000 }).should('contain', 'kind');
    cy.get(createBtn).click();
    cy.checkTitle(EXAMPLE);
    checkActionMenu('Service');
    cy.contains(brCrumbItem, 'Services').find('a').click();
    cy.get(itemFilter).type(EXAMPLE);
    cy.contains(row, EXAMPLE).should('exist');
  });
});

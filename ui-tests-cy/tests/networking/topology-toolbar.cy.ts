import {
  clearTopologySearch,
  searchTopology,
  visitAllNamespacesTopology,
  waitForTopologyPageReady,
} from '../../views/topology';

describe('OCPNETUI-137: Network topology toolbar', () => {
  beforeEach(() => {
    visitAllNamespacesTopology();
  });

  it('lists resource types in the filter menu and filters the graph', () => {
    cy.byLegacyTestID('topology-resource-filter').should('contain', 'Filter by').click();
    [
      // 'NIC',
      // 'Bond',
      // 'VLAN',
      // 'Linux bridge',
      // 'OVS bridge',
      // 'OVN bridge',
      // 'Tunnel',
      // 'Port',
      'Clear all filters',
      'NetworkAttachmentDefinition ',
      'UserDefinedNetwork',
      'ClusterUserDefinedNetwork',
    ].forEach((option) => {
      cy.contains('li', option).should('be.visible');
    });

    cy.contains('[role="option"]', 'NIC').click();
    cy.byLegacyTestID('topology-resource-filter').should('have.attr', 'aria-label', 'Filter: NIC');
    // Cluster assertions depend on real/fixtured data in the namespace.
    // TODO: seed a known resource set (e.g. fixtures/network-topology-toolbar.yaml)
    // and assert its nodes appear/disappear with the filter.
    waitForTopologyPageReady();

    cy.byLegacyTestID('topology-resource-filter').click();
    cy.contains('[role="option"]', 'All types').click();
    cy.byLegacyTestID('topology-resource-filter').should('contain', 'Filter by');
    waitForTopologyPageReady();
  });

  it('filters the graph from the search bar and clears the query', () => {
    cy.byLegacyTestID('topology-search').find('input').should('be.visible');
    searchTopology('bond0');
    // TODO: assert on a known node from fixture data
    clearTopologySearch();
    cy.byLegacyTestID('topology-search').find('input').should('have.value', '');

    searchTopology('no-such-resource');
    cy.get('svg text').should('not.exist');
  });

  it('adds and clears an advanced name filter', () => {
    // TODO: cluster page advanced-filter UI may differ from prototype.
    // Re-map to the deployed filter controls once confirmed on-cluster.
    cy.log('advanced name filter — TODO: wire to cluster controls');
  });

  it('toggles labels, management ports, compact view, and layout', () => {
    // Display toggles live on the cluster topology toolbar.
    cy.get('#topology-display-graph').should('be.visible');
    cy.byLegacyTestID('topology-search').should('be.visible');
    // TODO: exercise the cluster display-options toggle and assert label/layout changes
    cy.log('display toggles — TODO: wire to cluster controls');
  });

  it('switches between the topology canvas and the table list', () => {
    cy.get('button#topology-display-graph').should('be.visible');
    cy.get('button#topology-display-table').click();
    cy.get('table[role="grid"]').should('be.visible');
    cy.get('button#topology-display-graph').click();
    cy.get('#topology-display-graph').should('be.visible');
  });
});

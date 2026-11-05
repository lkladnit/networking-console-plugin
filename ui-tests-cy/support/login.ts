import { MINUTE } from '../utils/const/base';

const KUBEADMIN_USERNAME = 'kubeadmin';
const KUBEADMIN_IDP = 'kube:admin';
const TOUR_DISMISS = '[data-test="tour-step-footer-secondary"]';
const USER_MENU = '[data-test="user-dropdown"], [data-test="user-dropdown-toggle"], #page-sidebar';
const TOUR_WAIT_MS = 20_000;
const TOUR_POLL_MS = 500;

// The welcome tour only mounts on first login; once it has been dismissed or
// confirmed absent, later calls only need a single check instead of polling.
let welcomeTourSettled = false;

declare global {
  namespace Cypress {
    interface Chainable {
      dismissWelcomeTourIfPresent(): void;
      login(providerName?: string, username?: string, password?: string): Chainable<Element>;
      logout(): void;
    }
  }
}

/**
 * Fresh CI clusters show "Welcome to the new OpenShift experience!" after login.
 * The modal can mount after masthead is ready, so poll briefly without failing when absent.
 */
const dismissWelcomeTourIfPresent = () => {
  const deadline = Date.now() + TOUR_WAIT_MS;

  const tryDismiss = () => {
    cy.get('body').then(($body) => {
      if ($body.find(TOUR_DISMISS).length > 0) {
        cy.get(TOUR_DISMISS).click({ force: true });
        cy.get('.pf-v6-l-bullseye', { timeout: 15_000 }).should('not.exist');
        welcomeTourSettled = true;
        return;
      }

      if (welcomeTourSettled || Date.now() >= deadline) {
        welcomeTourSettled = true;
        return;
      }

      // Welcome modal mounts asynchronously on first login; poll until timeout.
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(TOUR_POLL_MS).then(tryDismiss);
    });
  };

  tryDismiss();
};

Cypress.Commands.add('dismissWelcomeTourIfPresent', dismissWelcomeTourIfPresent);

Cypress.Commands.add('login', (provider?: string, username?: string, password?: string) => {
  const usr = username || KUBEADMIN_USERNAME;
  const pwd = password || Cypress.env('BRIDGE_KUBEADMIN_PASSWORD');
  const idp = provider || KUBEADMIN_IDP;

  expect(pwd, 'BRIDGE_KUBEADMIN_PASSWORD (or password arg) must be set')
    .to.be.a('string')
    .and.not.be.empty;

  const baseUrl = Cypress.config('baseUrl') || '';
  const oauthOrigin = baseUrl
    .replace('console-openshift-console', 'oauth-openshift')
    .replace(/\/$/, '');

  cy.visit('/');
  cy.get('body', { timeout: 30_000 }).should('be.visible');
  cy.get('body').then(($body) => {
    const view = $body[0]?.ownerDocument?.defaultView as {
      SERVER_FLAGS?: { authDisabled?: boolean };
    } & Window | null;
    const flags = view?.SERVER_FLAGS;
    if (flags?.authDisabled) {
      cy.log('authDisabled — skipping OAuth login');
      return;
    }
    // Already authenticated? User menu is present on the console shell.
    if ($body.find(USER_MENU).length > 0) {
      cy.log('Already authenticated — skipping OAuth login');
      dismissWelcomeTourIfPresent();
      return;
    }
    // Not authenticated — need OAuth. Use window check as secondary authDisabled gate
    // before forcing a fresh OAuth redirect (clear stale session cookie, revisit).
    cy.window().then((win) => {
      if (win.SERVER_FLAGS?.authDisabled) {
        cy.log('authDisabled — skipping OAuth login');
        return;
      }
      cy.clearCookie('openshift-session-token');
      cy.visit('/');
      cy.origin(
        oauthOrigin,
        { args: { idp, pwd, usr } },
        ({ idp: originIdp, pwd: originPwd, usr: originUsr }) => {
          cy.get('body', { timeout: 180000 }).should('be.visible');
          cy.get('body').then(($originBody) => {
            if ($originBody.find('#inputUsername').length === 0) {
              if ($originBody.text().includes(originIdp)) {
                cy.contains('a', originIdp).click();
              } else if ($originBody.text().includes('kubeadmin')) {
                cy.contains('a', 'kubeadmin').click();
              } else {
                cy.get('a').first().click();
              }
            }
          });
          cy.get('#inputUsername', { timeout: 180000 }).should('be.visible');
          // Clear any prefilled/IDP-label value so we always submit kubeadmin, not kube:admin.
          cy.get('#inputUsername').clear();
          cy.get('#inputUsername').type(originUsr);
          cy.get('#inputPassword').clear();
          cy.get('#inputPassword').type(originPwd, { log: false });
          cy.get('button[type=submit]').click();
        },
      );
      cy.url({ timeout: 3 * MINUTE }).should('include', 'console-openshift-console');
      cy.get(USER_MENU, { timeout: 2 * MINUTE }).should('exist');
      dismissWelcomeTourIfPresent();
    });
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      return;
    }

    cy.get('body').then(($body) => {
      if ($body.find('[data-test="user-dropdown"]').length === 0) {
        cy.log('logout skipped: user menu not present');
        return;
      }
      cy.get('[data-test="user-dropdown"]').click();
      cy.get('[data-test="log-out"]').should('be.visible');
      cy.get('[data-test="log-out"]').click({ force: true });
    });
  });
});

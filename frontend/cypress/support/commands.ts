/// <reference types="cypress" />

export interface KanbanSeed {
  email: string;
  password: string;
  boardId: string;
  boardTitle: string;
  cardTitle: string;
  extraCardTitle: string;
}

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      seedKanban(): Chainable<KanbanSeed>;
      openCard(title: string): Chainable<JQuery<HTMLElement>>;
      fillInput(selector: string, value: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

const API_URL = Cypress.env('API_URL') || 'http://localhost:3001/api/v1';

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/boards', { timeout: 10000 });
});

Cypress.Commands.add('openCard', (title: string) => {
  cy.contains('[data-cy=card-item]', title, { timeout: 8000 }).click();
  cy.get('[data-cy=card-modal]').should('be.visible');
  cy.get('[data-cy=card-modal-heading]').should('contain', title);
});

Cypress.Commands.add('fillInput', (selector: string, value: string) => {
  cy.get(selector).should('exist').then(($input) => {
    const el = $input[0] as HTMLInputElement;
    const lastValue = el.value;
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    );
    descriptor?.set?.call(el, value);
    const tracker = (
      el as HTMLInputElement & { _valueTracker?: { setValue: (v: string) => void } }
    )._valueTracker;
    tracker?.setValue(lastValue);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  return cy.get(selector).should('have.value', value);
});

Cypress.Commands.add('seedKanban', () => {
  const stamp = Date.now();
  const email = `cypress_kanban_${stamp}@example.com`;
  const password = 'Password123!';
  const boardTitle = `Kanban Cypress ${stamp}`;
  const cardTitle = 'Cypress Card';
  const extraCardTitle = 'Outro Card';

  return cy
    .request({
      method: 'POST',
      url: `${API_URL}/auth/register`,
      body: { name: 'Cypress Kanban', email, password },
    })
    .then((registerRes) => {
      const payload = unwrapData<{
        tokens?: { accessToken: string };
        accessToken?: string;
      }>(registerRes.body);
      const token = payload.tokens?.accessToken || payload.accessToken;
      expect(token, 'token de registro').to.be.a('string');

      return cy
        .request({
          method: 'POST',
          url: `${API_URL}/boards`,
          headers: authHeader(token as string),
          body: { title: boardTitle },
        })
        .then((boardRes) => {
          const board = unwrapData<{ id: string }>(boardRes.body);
          expect(board.id).to.be.a('string');

          return cy
            .request({
              method: 'GET',
              url: `${API_URL}/boards/${board.id}`,
              headers: authHeader(token as string),
            })
            .then((detailRes) => {
              const detail = unwrapData<{
                columns: { id: string; title: string }[];
              }>(detailRes.body);
              const todo =
                detail.columns.find((column) => column.title === 'To Do') ??
                detail.columns[0];
              expect(todo, 'coluna para o card').to.exist;

              const createCard = (title: string) =>
                cy.request({
                  method: 'POST',
                  url: `${API_URL}/boards/${board.id}/cards`,
                  headers: authHeader(token as string),
                  body: {
                    title,
                    columnId: todo.id,
                    priority: 'MEDIUM',
                  },
                });

              return createCard(cardTitle)
                .then(() => createCard(extraCardTitle))
                .then(() => ({
                  email,
                  password,
                  boardId: board.id,
                  boardTitle,
                  cardTitle,
                  extraCardTitle,
                }));
            });
        });
    });
});

export {};

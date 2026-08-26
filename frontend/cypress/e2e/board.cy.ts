describe('Kanban Board Flow', () => {
  const testEmail = `cypress_user_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const apiUrl = Cypress.env('API_URL') || 'http://localhost:3001/api/v1';

  before(() => {
    // Seed user directly through API
    cy.request({
      method: 'POST',
      url: `${apiUrl}/auth/register`,
      body: {
        name: 'Cypress Tester',
        email: testEmail,
        password: testPassword,
      },
      failOnStatusCode: false,
    });
  });

  beforeEach(() => {
    cy.login(testEmail, testPassword);
  });

  it('allows user to create a board, create column, create card and interact', () => {
    const boardTitle = `Board ${Date.now()}`;

    // 1. Create Board
    cy.contains(/novo board/i).click();
    cy.get('input[name="title"]').type(boardTitle);
    cy.get('button[type="submit"]').click();

    // 2. Open Board
    cy.contains(boardTitle, { timeout: 8000 }).click();
    cy.url().should('include', '/boards/');

    // 3. Add Column
    cy.contains(/nova coluna/i).click();
    cy.get('input[placeholder*="coluna"]').type('To Do');
    cy.contains('button', /adicionar/i).click();
    cy.contains('To Do', { timeout: 6000 }).should('be.visible');

    // 4. Add Card
    cy.contains(/adicionar card/i).click();
    cy.get('textarea[placeholder*="card"]').type('First Task{enter}');
    cy.contains('First Task', { timeout: 6000 }).should('be.visible');
  });
});

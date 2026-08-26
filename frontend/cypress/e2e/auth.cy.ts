describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('renders login page with necessary elements', () => {
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('displays validation errors on empty submit', () => {
    cy.get('button[type="submit"]').click();
    cy.contains(/obrigatório|inválid/i).should('exist');
  });

  it('navigates to registration page and shows form', () => {
    cy.contains(/cadastre-se|criar conta|registre/i).click();
    cy.url().should('include', '/register');
    cy.get('input[name="name"]').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('input[name="confirmPassword"]').should('be.visible');
  });

  it('fails with invalid credentials message', () => {
    cy.get('input[name="email"]').type('invalid_user_test@domain.com');
    cy.get('input[name="password"]').type('wrongpassword123');
    cy.get('button[type="submit"]').click();
    cy.contains(/inválid|erro|incorret|unauthorized/i, { timeout: 6000 }).should('exist');
  });
});

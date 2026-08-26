import type { KanbanSeed } from '../support/commands';

describe('Kanban — sprints, tags, horas e atividades', { testIsolation: false }, () => {
  let seed: KanbanSeed;

  before(() => {
    cy.seedKanban().then((created) => {
      seed = created;
      cy.login(created.email, created.password);
    });
  });

  beforeEach(() => {
    cy.visit(`/boards/${seed.boardId}`);
    cy.url().should('include', `/boards/${seed.boardId}`);
    cy.contains('To Do', { timeout: 15000 }).should('be.visible');
    cy.contains('[data-cy=card-item]', seed.cardTitle, { timeout: 15000 }).should(
      'be.visible',
    );
    cy.contains('[data-cy=card-item]', seed.extraCardTitle).should('be.visible');
  });

  it('cria uma sprint ativa pelo modal', () => {
    const name = `Sprint ${Date.now()}`;

    cy.get('[data-cy=sprint-create-open]').click();
    cy.contains('h2', 'Nova Sprint').should('be.visible');
    cy.get('[data-cy=sprint-name]').click();
    cy.get('[data-cy=sprint-name]').type(name, { delay: 0 });
    cy.contains('h2', 'Nova Sprint').should('be.visible');
    cy.contains('button', 'Criar sprint').scrollIntoView().click({ force: true });

    cy.contains(/sprint criada/i, { timeout: 8000 }).should('exist');
    cy.get('[data-cy=sprint-filter]').should('contain', name);
  });

  it('cria uma tag pelo modal', () => {
    const name = `bug-${Date.now()}`;

    cy.get('[data-cy=tag-create-open]').click();
    cy.contains('h2', 'Nova Tag').should('be.visible');
    cy.get('[data-cy=tag-name]').type(name, { force: true });
    cy.get('[data-cy=tag-submit]', { timeout: 8000 })
      .should('not.be.disabled')
      .click();

    cy.contains(/tag criada/i, { timeout: 8000 }).should('exist');
    cy.get('[data-cy=tag-filter]').should('contain', name);
  });

  it('vincula sprint, tag e horas planejadas ao card e filtra o quadro', () => {
    const sprintName = `Filtro ${Date.now()}`;
    const tagName = `feat-${Date.now()}`;

    cy.get('[data-cy=sprint-create-open]').click();
    cy.contains('h2', 'Nova Sprint').should('be.visible');
    cy.get('[data-cy=sprint-name]').click();
    cy.get('[data-cy=sprint-name]').type(sprintName, { delay: 0 });
    cy.contains('h2', 'Nova Sprint').should('be.visible');
    cy.contains('button', 'Criar sprint').scrollIntoView().click({ force: true });
    cy.contains(/sprint criada/i, { timeout: 8000 }).should('exist');
    cy.contains('h2', 'Nova Sprint').should('not.exist');

    cy.get('[data-cy=tag-create-open]').click();
    cy.contains('h2', 'Nova Tag').should('be.visible');
    cy.get('[data-cy=tag-name]').type(tagName, { force: true });
    cy.get('[data-cy=tag-submit]', { timeout: 8000 })
      .should('not.be.disabled')
      .click();
    cy.contains(/tag criada/i, { timeout: 8000 }).should('exist');
    cy.contains('h2', 'Nova Tag').should('not.exist');

    cy.openCard(seed.cardTitle);
    cy.get('[data-cy=tab-details]').click({ force: true });
    cy.get('[data-cy=card-sprint]').select(sprintName);
    cy.get(`[data-cy="card-tag-${tagName}"]`).click();
    cy.fillInput('[data-cy=card-estimated-hours]', '8');
    cy.get('[data-cy=card-save]').click();
    cy.contains(/card atualizado/i, { timeout: 8000 }).should('exist');
    cy.get('[data-cy=card-modal]').should('not.exist');

    cy.contains('[data-cy=card-item]', seed.cardTitle)
      .find('[data-cy=card-hours]')
      .should('contain', '8h');
    cy.contains('[data-cy=card-item]', seed.cardTitle).should('contain', tagName);

    cy.get('[data-cy=sprint-filter]').select(`${sprintName} (Ativa)`);
    cy.contains('[data-cy=card-item]', seed.cardTitle).should('be.visible');
    cy.contains('[data-cy=card-item]', seed.extraCardTitle).should('not.exist');

    cy.get('[data-cy=clear-filters]').click();
    cy.contains('[data-cy=card-item]', seed.extraCardTitle).should('be.visible');

    cy.get('[data-cy=tag-filter]').select(tagName);
    cy.contains('[data-cy=card-item]', seed.cardTitle).should('be.visible');
    cy.contains('[data-cy=card-item]', seed.extraCardTitle).should('not.exist');
  });

  it('inicia e pausa o cronômetro (Play/Pause)', () => {
    cy.openCard(seed.cardTitle);
    cy.contains('button', 'Apontamento de Horas').click({ force: true });
    cy.contains('Cronômetro', { timeout: 8000 }).should('be.visible');

    cy.get('[data-cy=timer-display]').should('have.text', '00:00:00');
    cy.fillInput('[data-cy=timer-note]', 'Pairing Cypress');
    cy.get('[data-cy=timer-play]').should('be.enabled').click();

    cy.contains(/atividade iniciada/i, { timeout: 8000 }).should('exist');
    cy.get('[data-cy=timer-pause]', { timeout: 8000 }).should('be.visible');
    cy.get('[data-cy=timelog-history]').should('contain', 'em andamento');
    cy.get('[data-cy=timer-display]', { timeout: 4000 }).should(
      'not.have.text',
      '00:00:00',
    );

    cy.get('[data-cy=timer-pause]').click();
    cy.contains(/horas registradas/i, { timeout: 8000 }).should('exist');
    cy.get('[data-cy=timer-play]').should('be.visible');
    cy.get('[data-cy=timelog-history]').should('not.contain', 'em andamento');
  });

  it('lança apontamento manual de horas', () => {
    cy.openCard(seed.cardTitle);
    cy.contains('button', 'Apontamento de Horas').click({ force: true });
    cy.contains('Cronômetro', { timeout: 8000 }).should('be.visible');

    cy.fillInput('[data-cy=manual-hours]', '1');
    cy.fillInput('[data-cy=manual-minutes]', '30');
    cy.fillInput('[data-cy=timer-note]', 'Reunião de planning');
    cy.get('[data-cy=manual-submit]').should('be.enabled').click();

    cy.contains(/apontamento adicionado/i, { timeout: 8000 }).should('exist');
    cy.get('[data-cy=timelog-history]', { timeout: 8000 }).should('contain', '1h 30m');
    cy.get('[data-cy=timelog-history]').should('contain', 'Reunião de planning');
    cy.get('[data-cy=executed-summary]').should('contain', '1.50h');
  });

  it('filtra cards pela busca de texto', () => {
    cy.fillInput('[data-cy=search-cards]', seed.cardTitle);

    cy.contains('[data-cy=card-item]', seed.cardTitle).should('be.visible');
    cy.contains('[data-cy=card-item]', seed.extraCardTitle).should('not.exist');

    cy.get('[data-cy=clear-filters]').click();
    cy.contains('[data-cy=card-item]', seed.extraCardTitle).should('be.visible');
  });

  it('abre e fecha o painel de Atividades', () => {
    cy.get('[data-cy=activities-toggle]').should(
      'have.attr',
      'aria-expanded',
      'false',
    );
    cy.get('[data-cy=activities-close]').should('not.be.visible');

    cy.contains('button', 'Atividades').should('be.visible').click();
    cy.get('[data-cy=activities-toggle]').should(
      'have.attr',
      'aria-expanded',
      'true',
    );
    cy.get('[data-cy=activities-panel]').should('be.visible');
    cy.get('[data-cy=activities-feed]').should('be.visible');
    cy.contains('[data-cy=activities-feed]', /board criado|card criado/i).should(
      'be.visible',
    );

    cy.get('[data-cy=activities-close]').click();
    cy.get('[data-cy=activities-toggle]').should(
      'have.attr',
      'aria-expanded',
      'false',
    );
    cy.get('[data-cy=activities-close]').should('not.be.visible');
  });
});

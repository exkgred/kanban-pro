import { create } from 'zustand';
import { Board, Column, Card, Label, Activity, Sprint } from '../types';

interface BoardState {
  board: Board | null;
  columns: Column[];
  cards: Card[];
  labels: Label[];
  sprints: Sprint[];
  activities: Activity[];
  isLoading: boolean;
  filters: {
    labelId?: string;
    assigneeId?: string;
    priority?: string;
    sprintId?: string;
    q?: string;
  };
  setBoard: (board: Board) => void;
  setColumns: (columns: Column[]) => void;
  setCards: (cards: Card[]) => void;
  setLabels: (labels: Label[]) => void;
  setSprints: (sprints: Sprint[]) => void;
  addSprint: (sprint: Sprint) => void;
  addLabel: (label: Label) => void;
  setFilters: (filters: Partial<BoardState['filters']>) => void;
  moveCardOptimistic: (cardId: string, newColumnId: string, newPosition: number) => void;
  revertCard: (card: Card) => void;
  handleCardCreated: (card: Card) => void;
  handleCardUpdated: (card: Card) => void;
  handleCardMoved: (data: { card: Card }) => void;
  handleCardDeleted: (data: { cardId: string }) => void;
  handleColumnUpdated: (column: Column) => void;
  handleActivityCreated: (activity: Activity) => void;
  reset: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  board: null,
  columns: [],
  cards: [],
  labels: [],
  sprints: [],
  activities: [],
  isLoading: true,
  filters: {},

  setBoard: (board) => set({ board, isLoading: false }),
  setColumns: (columns) => set({ columns: columns.sort((a, b) => a.position - b.position) }),
  setCards: (cards) => set({ cards }),
  setLabels: (labels) => set({ labels }),
  setSprints: (sprints) => set({ sprints }),
  addSprint: (sprint) => set((state) => ({ sprints: [sprint, ...state.sprints] })),
  addLabel: (label) => set((state) => ({ labels: [...state.labels, label] })),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  moveCardOptimistic: (cardId, newColumnId, newPosition) => set((state) => {
    const newCards = state.cards.map((c) =>
      c.id === cardId ? { ...c, columnId: newColumnId, position: newPosition } : c,
    );
    return { cards: newCards };
  }),

  revertCard: (originalCard) => set((state) => ({
    cards: state.cards.map((c) => (c.id === originalCard.id ? originalCard : c)),
  })),

  handleCardCreated: (card) => set((state) => ({ cards: [...state.cards, card] })),

  handleCardUpdated: (card) => set((state) => ({
    cards: state.cards.map((c) => (c.id === card.id ? { ...c, ...card } : c)),
  })),

  handleCardMoved: ({ card }) => set((state) => ({
    cards: state.cards.map((c) => (c.id === card.id ? card : c)),
  })),

  handleCardDeleted: ({ cardId }) => set((state) => ({
    cards: state.cards.filter((c) => c.id !== cardId),
  })),

  handleColumnUpdated: (column) => set((state) => ({
    columns: state.columns
      .map((c) => (c.id === column.id ? column : c))
      .sort((a, b) => a.position - b.position),
  })),

  handleActivityCreated: (activity) => set((state) => ({
    activities: [activity, ...state.activities],
  })),

  reset: () => set({
    board: null,
    columns: [],
    cards: [],
    labels: [],
    sprints: [],
    activities: [],
    isLoading: true,
    filters: {},
  }),
}));

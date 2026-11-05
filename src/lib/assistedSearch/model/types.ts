import type { GenomicClause, PhenotypicClause } from '#lib/query/query.ts';

/** The slimmed facet shape the AI service reads and writes; the UI's `Facet` is display state. */
export type SlimFacet = { category: string; name: string };

/** The three query fields the assistant may set. The rest of the researcher's query is theirs. */
export type ChatQuery = {
  select: string[];
  phenotypicClause: PhenotypicClause | null;
  genomicFilters: GenomicClause[];
};

/** Everything on the researcher's screen that a chat turn can read or change. */
export type ScreenState = {
  query: ChatQuery;
  facets: SlimFacet[];
  search: string;
};

export type ScreenPart = keyof ScreenState;

export type ChatRequest = {
  message: string;
  conversationId: string;
  requestId: string;
  query?: ChatQuery;
  facets?: SlimFacet[];
  search?: string;
};

/** Each of `query`/`facets`/`search` is present only when the turn changed it. */
export type ChatResponse = {
  response: string;
  query?: ChatQuery;
  facets?: SlimFacet[];
  search?: string;
};

export type ChatMessage = {
  /** The turn's requestId, shared by the user message and its reply. */
  id: string;
  role: 'user' | 'assistant';
  text: string;
  failed?: boolean;
  /** Parts of the screen this reply changed. */
  changed?: ScreenPart[];
  /** The screen as it was before this reply changed it. */
  before?: ScreenState;
  /** The screen as it was just after this reply changed it; undo and redo only apply while it holds. */
  after?: ScreenState;
  undone?: boolean;
  /** The researcher stopped waiting on this turn, so a refresh does not bring its reply back. */
  stopped?: boolean;
  /** The reply proposed changes that could not be put on screen. */
  applyFailed?: boolean;
};

/** A chat as kept in the tab's session storage. */
export type SavedChat = {
  conversationId: string | null;
  messages: ChatMessage[];
  open: boolean;
  savedAt: number;
};

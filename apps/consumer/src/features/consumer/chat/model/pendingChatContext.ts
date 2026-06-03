/** Module-level singleton to pass store context from any screen to ChatIA. */
let pending: { id: string; nome: string } | null = null;

export function setPendingChatContext(ctx: { id: string; nome: string }) {
  pending = ctx;
}

/** Returns and clears the pending context (call once when chat gains focus). */
export function takePendingChatContext(): { id: string; nome: string } | null {
  const ctx = pending;
  pending = null;
  return ctx;
}

/** Module-level singleton to trigger a quick action in ChatIA from any screen. */
let pendingAction: string | null = null;

export function setPendingChatAction(action: string) {
  pendingAction = action;
}

/** Returns and clears the pending action (call once when chat gains focus). */
export function takePendingChatAction(): string | null {
  const action = pendingAction;
  pendingAction = null;
  return action;
}

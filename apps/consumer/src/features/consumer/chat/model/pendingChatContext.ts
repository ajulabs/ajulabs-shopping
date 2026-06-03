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

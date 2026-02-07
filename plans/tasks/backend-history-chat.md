# Backend Agent Task: History Chat API

> **Assigned by:** Planner Agent  
> **Plan:** [history-chat-list.md](../history-chat-list.md)  
> **Status:** ✅ COMPLETE (2025-02-07)  
> **Blocked by:** None — start here

---

## TASK

Implement the History Chat API — CRUD endpoints for chat sessions with in-memory storage.

---

## FILES (You CAN Modify)

- `src/app/api/chats/route.ts` — GET (list), POST (create)
- `src/app/api/chats/[id]/route.ts` — GET (get one), PATCH (update), DELETE (delete)
- `src/types/` — Add ChatSession, ChatListItem types (shared, coordinate with Frontend)
- `src/lib/store/chats.ts` — In-memory store (create if needed — Backend owns storage logic; may need `src/lib/` extension per agent scope)

**Note:** Backend agent scope allows `src/app/api/**`, `src/lib/ai/**`, `src/lib/validators/**`. For chat storage, you may:
- Keep state in module-level Map inside route files, or
- Create `src/lib/store/chats.ts` if your rules allow `src/lib/` extensions for new modules.

---

## INPUTS

**Types to add (in `src/types/chat-history.ts` or `src/types/index.ts`):**

```typescript
// Ensure Message type is compatible — app uses Message with id, role, content, timestamp, codeContext
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

export interface ChatListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface CreateChatBody {
  title?: string;
  messages?: Message[];
}

export interface UpdateChatBody {
  title?: string;
  messages?: Message[];
}
```

---

## OUTPUTS (API Contract)

### GET /api/chats
- **Response:** 200 — `{ chats: ChatListItem[] }`
- **Errors:** 500

### GET /api/chats/[id]
- **Response:** 200 — `ChatSession`
- **Errors:** 404 if not found, 500

### POST /api/chats
- **Request:** `{ title?: string, messages?: Message[] }`
- **Response:** 201 — `ChatSession`
- **Errors:** 400 (validation), 500
- **Title default:** `"New Chat"` if not provided
- **Messages default:** `[]` if not provided
- **ID:** Generate UUID or `crypto.randomUUID()`
- **createdAt/updatedAt:** Set to current ISO 8601 string

### PATCH /api/chats/[id]
- **Request:** `{ title?: string, messages?: Message[] }`
- **Response:** 200 — `ChatSession`
- **Errors:** 404 if not found, 400, 500
- **updatedAt:** Update to current ISO 8601 string

### DELETE /api/chats/[id]
- **Response:** 204 No Content
- **Errors:** 404 if not found, 500

---

## ACCEPTANCE

1. [ ] GET /api/chats returns empty array when no chats exist
2. [ ] POST /api/chats creates a chat and returns it
3. [ ] GET /api/chats/[id] returns the chat or 404
4. [ ] PATCH /api/chats/[id] updates title/messages and returns updated chat
5. [ ] DELETE /api/chats/[id] removes the chat and returns 204
6. [ ] List endpoint returns ChatListItem[] (id, title, createdAt, updatedAt, messageCount)
7. [ ] All responses use proper Content-Type: application/json
8. [ ] Validation for POST/PATCH body (title string, messages array)
9. [ ] TypeScript compiles without errors
10. [ ] No modifications to `src/components/**`, `src/hooks/**`, `src/app/page.tsx`

---

## NOTES

- Use in-memory storage for MVP (Map or object). Data is lost on server restart; OK for this phase.
- Use `crypto.randomUUID()` for IDs.
- Message type from `src/types/index.ts` has: `id`, `role`, `content`, `timestamp`, `codeContext`.
- Document API for Frontend Agent in a brief comment or README when done.

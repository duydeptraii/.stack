# Feature: History Chat List

> **Status:** Ready for implementation  
> **Created:** 2025-02-07  
> **Planner:** Planner Agent

---

## Requirements Summary

- [ ] Users can view a list of past chat sessions
- [ ] Users can select a chat from history to view/continue the conversation
- [ ] Users can create new chats
- [ ] Users can delete chats from history
- [ ] Chat titles are derived from first user message (or "New Chat" if empty)
- [ ] History persists across page reloads (backend storage)
- [ ] Chat list is collapsible/expandable (sidebar UX)

---

## Shared Dependencies (Do First)

### 1. Define types in `src/types/`

**File:** `src/types/index.ts` (extend) or new `src/types/chat-history.ts`

Add:

```typescript
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}

export interface ChatListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface CreateChatRequest {
  title?: string;
  messages?: Message[];
}

export interface UpdateChatRequest {
  title?: string;
  messages?: Message[];
}
```

**Owner:** Planner/Backend (types used by API) — Backend Agent may add these when implementing API.

---

## Backend Tasks (Backend Agent) ✅ COMPLETE

1. [x] **Create GET /api/chats** — List all chat sessions (returns `ChatListItem[]`)
   - Files: `src/app/api/chats/route.ts`
   - Use in-memory Map for MVP (can migrate to DB later)
   - Response: `{ chats: ChatListItem[] }`

2. [x] **Create GET /api/chats/[id]** — Get single chat with full messages
   - Files: `src/app/api/chats/[id]/route.ts`
   - Response: `ChatSession` or 404

3. [x] **Create POST /api/chats** — Create new chat session
   - Files: `src/app/api/chats/route.ts`
   - Body: `{ title?: string, messages?: Message[] }`
   - Response: `ChatSession`

4. [x] **Create PATCH /api/chats/[id]** — Update chat (title, messages)
   - Files: `src/app/api/chats/[id]/route.ts`
   - Response: `ChatSession`

5. [x] **Create DELETE /api/chats/[id]** — Delete a chat session
   - Files: `src/app/api/chats/[id]/route.ts`
   - Response: 204 No Content

6. [x] **Create chat store** — In-memory storage helper
   - Files: `src/lib/store/chats.ts` (or similar — Backend may choose location)
   - Note: Backend agent scope is `src/app/api/**`, `src/lib/ai/**`, `src/lib/validators/**`. Chat store could live in `src/lib/` (shared) — Backend may create `src/lib/store/chats.ts` if allowed, or keep state in route handlers.

---

## Frontend Tasks (Frontend Agent)

1. [ ] **Create useChatHistory hook** — Fetch/list/create/update/delete chats
   - Files: `src/hooks/useChatHistory.ts`
   - Consumes: GET/POST /api/chats, GET/PATCH/DELETE /api/chats/[id]
   - Exposes: `{ chats, activeChatId, loadChat, createChat, updateChat, deleteChat, isLoading, error }`

2. [ ] **Create ChatHistoryList component** — Sidebar list of past chats
   - Files: `src/components/chat/ChatHistoryList.tsx`
   - Props: `chats`, `activeChatId`, `onSelect`, `onNewChat`, `onDelete`, `collapsed`, `onToggleCollapse`
   - UI: Collapsible sidebar, scrollable list, empty state

3. [ ] **Create ChatHistorySidebar component** — Wrapper with toggle
   - Files: `src/components/chat/ChatHistorySidebar.tsx`
   - Wraps ChatHistoryList, handles expand/collapse state
   - Integrates with page layout (left side of chat area)

4. [ ] **Integrate into page.tsx** — Add sidebar + wire state
   - Files: `src/app/page.tsx`
   - Add ChatHistorySidebar, useChatHistory, pass activeChat/messages to ChatContainer

5. [ ] **Update ChatContainer** — Support loading existing chat + saving on change
   - Files: `src/components/chat/ChatContainer.tsx`
   - Props: `activeChatId`, `messages`, `onMessagesChange`, `onSaveChat`
   - Load messages when activeChatId changes; save (PATCH) when messages change

6. [ ] **Update chat/index.ts** — Export new components
   - Files: `src/components/chat/index.ts`

---

## Integration Points

### API Contract

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/chats` | — | `{ chats: ChatListItem[] }` |
| GET | `/api/chats/[id]` | — | `ChatSession` |
| POST | `/api/chats` | `{ title?, messages? }` | `ChatSession` |
| PATCH | `/api/chats/[id]` | `{ title?, messages? }` | `ChatSession` |
| DELETE | `/api/chats/[id]` | — | 204 |

### Data Flow

1. Page loads → `useChatHistory` fetches GET /api/chats
2. User selects chat → `loadChat(id)` → GET /api/chats/[id] → pass messages to ChatContainer
3. User sends message → ChatContainer updates messages → `updateChat(id, { messages })` → PATCH
4. User clicks "New Chat" → `createChat()` → POST → set as active
5. User deletes chat → `deleteChat(id)` → DELETE

---

## Review Checkpoints

- [ ] After shared types defined
- [ ] After API implementation complete (Backend)
- [ ] After UI implementation complete (Frontend)
- [ ] Final integration review

---

## Execution Order

1. **Backend Agent** — Implement API + types (shared types in `src/types/`)
2. **Frontend Agent** — Implement UI + hooks (after API is ready)
3. **Reviewer Agent** — Validate integration at final checkpoint

# Frontend Agent Task: History Chat List UI

> **Assigned by:** Planner Agent  
> **Plan:** [history-chat-list.md](../history-chat-list.md)  
> **Status:** Blocked — start after Backend Agent completes  
> **Blocked by:** Backend Agent — API endpoints must exist first

---

## TASK

Implement the History Chat List UI — sidebar with chat list, hooks to consume API, and integration with ChatContainer.

---

## FILES (You CAN Modify)

- `src/hooks/useChatHistory.ts` — New hook
- `src/components/chat/ChatHistoryList.tsx` — New component
- `src/components/chat/ChatHistorySidebar.tsx` — New component
- `src/components/chat/ChatContainer.tsx` — Update to support active chat / save
- `src/components/chat/index.ts` — Export new components
- `src/app/page.tsx` — Integrate sidebar, useChatHistory, pass state to ChatContainer
- `src/types/` — Add/use ChatSession, ChatListItem if Backend hasn’t (shared)

---

## API_CONTRACT (Provided by Backend)

- **GET /api/chats** — `{ chats: ChatListItem[] }`
- **GET /api/chats/[id]** — `ChatSession`
- **POST /api/chats** — Body: `{ title?: string, messages?: Message[] }` → `ChatSession`
- **PATCH /api/chats/[id]** — Body: `{ title?: string, messages?: Message[] }` → `ChatSession`
- **DELETE /api/chats/[id]** — 204

---

## UI_REQUIREMENTS

1. **ChatHistorySidebar**
   - Collapsible left sidebar
   - Toggle button (e.g. hamburger or list icon)
   - Width ~240px when expanded; collapses to icon-only or hidden
   - Responsive: on mobile, overlay or drawer

2. **ChatHistoryList**
   - List of past chats (title, date)
   - "New Chat" button at top
   - Click chat → load and display in ChatContainer
   - Delete action (icon/button) per chat with confirmation
   - Empty state: "No chats yet. Start a new conversation."
   - Loading state
   - Scroll when many chats

3. **Integration**
   - Active chat highlighted in list
   - ChatContainer shows messages for active chat
   - On send message → PATCH to save messages
   - Title derived from first user message (or "New Chat")
   - New chat → POST, then set as active

4. **Styling**
   - Tailwind CSS, shadcn/ui components
   - Dark/light theme support
   - Consistent with existing layout (header, code panel)

---

## ACCEPTANCE

1. [ ] useChatHistory hook fetches list, loads chat, creates, updates, deletes
2. [ ] ChatHistorySidebar is collapsible and shows ChatHistoryList
3. [ ] Selecting a chat loads its messages into ChatContainer
4. [ ] New Chat creates a chat and shows empty state
5. [ ] Sending a message saves to backend (PATCH)
6. [ ] Title updates from first user message
7. [ ] Delete chat works with confirmation
8. [ ] Empty, loading, error states handled
9. [ ] Responsive on mobile/tablet
10. [ ] Dark/light theme works
11. [ ] TypeScript compiles without errors
12. [ ] No modifications to `src/app/api/**`, `src/lib/ai/**`, `src/lib/validators/**`

---

## NOTES

- Start only after Backend Agent has implemented the API.
- Use fetch to call backend endpoints.
- Integrate with existing ChatContainer props; avoid breaking current behavior.
- Consider keyboard shortcuts (e.g. Ctrl+N for new chat) if time permits.

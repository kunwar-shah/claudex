# Universal LLM Memory — Separate Project Vision

> **Status**: Vision & Pre-Planning (v0.2)
> **Date**: 2026-02-12
> **Type**: Standalone open-source project (NOT part of Claudex)
> **Codename**: TBD (needs a name — "Recall", "Persist", "Mnemo", "Cortex", etc.)

---

## Relationship to Claudex

| | Claudex | Universal LLM Memory |
|---|---------|---------------------|
| **Scope** | Claude Code conversation viewer | Memory for ANY LLM application |
| **Domain** | Software engineering only | Domain-agnostic (healthcare, legal, finance, education, etc.) |
| **Integration** | MCP server (stdio, Claude Code) | MCP server + API proxy + REST API |
| **Database** | Shared SQLite with Claudex web viewer | Isolated SQLite per tenant |
| **Repository** | `kunwar-shah/claudex` | New repo (TBD) |
| **Dependency** | None on Universal Memory | None on Claudex |

**Claudex MCP** will continue to have coding-specific memory tables (codebase maps, conventions, decisions) tied to Claude Code. That will never change.

**Universal LLM Memory** is a separate, larger project that solves the stateless LLM problem for every domain and every application.

---

## The Problem

Every LLM application has the same fundamental flaw: **LLMs are stateless**.

This affects every domain:
- **Healthcare**: AI assistant forgets patient history, treatment protocols, drug interactions between sessions
- **Legal**: Contract review AI forgets clause patterns, precedent decisions, client preferences
- **Finance**: Portfolio AI forgets risk profiles, market analysis history, compliance rules
- **Education**: Tutoring AI forgets student progress, learning style, weak areas
- **E-commerce**: Shopping AI forgets customer preferences, purchase patterns, return history
- **Software**: Coding AI forgets codebase structure, conventions, past decisions

Existing solutions (Mem0, SuperMemory, Zep) use vector embeddings of raw text. This is:
- **Noisy**: Everything gets embedded, no structure
- **Opaque**: Can't query "show me all patient allergies" — just similarity search
- **Expensive**: Vector DBs at scale cost serious money
- **Not budget-aware**: They dump context until the prompt overflows

---

## The Vision

**A self-hostable, open-source memory system that gives persistent, structured memory to ANY LLM application, in ANY domain.**

### Core Principles

1. **Domain-agnostic core, domain-specific templates** — The memory schema is universal. Domain knowledge comes via optional templates.
2. **Tenant isolation with own DB** — Every developer/team/app gets its own SQLite file. No shared database. No noisy neighbors.
3. **Token-budget-aware** — Never overflow. Inject memories by priority until the budget is filled.
4. **Structured, not vector** — Queryable JSON, not opaque embeddings. Human-readable, debuggable.
5. **Runs everywhere** — Laptop, desktop, server, cloud, edge devices. SQLite runs on everything.
6. **Zero vendor lock-in** — Works with OpenAI, Anthropic, Google, local models, any provider.

---

## Architecture

### System Overview

```
┌────────────────────────────────────────────────────┐
│          ANY Application (any domain)               │
│  Healthcare AI / Legal Bot / Coding Agent / etc.    │
└──────────────────┬─────────────────────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
   Mode 1: MCP        Mode 2: API Proxy
   (tool calls)       (transparent intercept)
          │                 │
          └────────┬────────┘
                   ▼
┌────────────────────────────────────────────────────┐
│              Memory Engine                          │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Tenant   │  │  Token   │  │  Memory           │  │
│  │ Router   │→ │  Budget  │→ │  Injector         │  │
│  │          │  │  Manager │  │  (priority-based) │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Memory   │  │  Learn   │  │  Extractor        │  │
│  │ Store    │← │  Engine  │← │  (configurable)   │  │
│  │ (SQLite) │  │          │  │                   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Three Integration Modes

**Mode 1: MCP Server**
For MCP-compatible clients (Claude Code, etc.):
- `store_memory`, `recall_memory`, `list_memories`, `delete_memory` tools
- Resources for browsing tenant memories
- Zero proxy needed — direct tool calls

**Mode 2: API Proxy**
For any app that calls LLM APIs:
- Transparent proxy: `localhost:8787/v1/chat/completions`
- Intercepts requests → injects memories → forwards to provider
- Supports OpenAI, Anthropic, Google API formats
- Drop-in: just change the base URL in your app

**Mode 3: REST API (SDK)**
For apps that want explicit control:
- `POST /memories` — store a memory
- `GET /memories?namespace=X&type=Y` — recall memories
- `POST /inject` — get memory-enriched prompt for a given context
- SDKs: Node.js, Python, Go

### Tenant Isolation

```
/data/
├── tenants/
│   ├── tenant-abc123/
│   │   ├── memory.db          ← Own SQLite (isolated)
│   │   └── config.json        ← Domain template, model prefs, budget rules
│   ├── tenant-def456/
│   │   ├── memory.db
│   │   └── config.json
│   └── ...
└── system.db                  ← Tenant registry, API keys, usage tracking
```

**Why SQLite per tenant?**
- File-level isolation (no data leaks, no row-level security complexity)
- Copy to backup/migrate = `cp memory.db memory.db.bak`
- Zero infra (no Postgres, no Redis, no connection pools)
- Runs on edge/IoT/embedded if needed
- Each DB stays small (1-50MB per tenant)
- Horizontal scaling = more files, not bigger DB

### Universal Memory Schema

One flexible schema that works for ANY domain:

```sql
CREATE TABLE memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  namespace TEXT NOT NULL,       -- grouping: "patients", "codebase", "contracts"
  memory_type TEXT NOT NULL,     -- kind: "entity", "map", "rule", "decision", "snapshot"
  key TEXT NOT NULL,             -- identifier: "patient-123", "file-tree", "nda-clause"
  value JSON NOT NULL,           -- the actual memory (structured)
  metadata JSON DEFAULT '{}',   -- tags, source, domain-specific fields
  priority INTEGER DEFAULT 5,   -- 1-10, injection priority (10 = always inject)
  confidence REAL DEFAULT 1.0,  -- 0.0-1.0, decays if contradicted
  ttl_hours INTEGER DEFAULT NULL, -- auto-expire (NULL = persist forever)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT NULL,
  UNIQUE(namespace, memory_type, key)
);

CREATE INDEX idx_memories_ns_type ON memories(namespace, memory_type);
CREATE INDEX idx_memories_priority ON memories(priority DESC);
CREATE INDEX idx_memories_expires ON memories(expires_at) WHERE expires_at IS NOT NULL;

-- Full-text search on memory values
CREATE VIRTUAL TABLE memories_fts USING fts5(
  namespace, memory_type, key, value,
  content=memories, content_rowid=id
);
```

### Domain Examples

Same schema, different content:

**Software Engineering:**
```json
{ "namespace": "codebase", "memory_type": "map", "key": "file-tree",
  "value": {"src/": ["index.ts", "server.ts"], "tests/": ["unit/", "e2e/"]},
  "priority": 8 }
```

**Healthcare:**
```json
{ "namespace": "patients", "memory_type": "entity", "key": "patient-456",
  "value": {"name": "Jane D.", "conditions": ["diabetes-t2"], "allergies": ["penicillin"], "currentMeds": ["metformin"]},
  "priority": 9 }
```

**Legal:**
```json
{ "namespace": "contracts", "memory_type": "rule", "key": "nda-standard-clause",
  "value": {"template": "The Receiving Party shall...", "variations": ["mutual", "one-way"], "jurisdiction": "US-CA"},
  "priority": 7 }
```

**Finance:**
```json
{ "namespace": "portfolio", "memory_type": "entity", "key": "client-789",
  "value": {"riskProfile": "moderate", "holdings": ["AAPL", "MSFT", "BND"], "rebalanceDate": "2026-03-01"},
  "priority": 8 }
```

**Education:**
```json
{ "namespace": "students", "memory_type": "snapshot", "key": "student-101-progress",
  "value": {"level": 5, "completedModules": [1,2,3,4,5], "weakAreas": ["algebra", "fractions"]},
  "priority": 6, "ttl_hours": 168 }
```

### Token Budget Manager

```
Input: model context window, current conversation tokens, memory candidates
Output: ordered list of memories that fit within budget

Algorithm:
  1. Calculate available_budget = model_limit - conversation_tokens - safety_margin(10%)
  2. Sort memories by: priority DESC, confidence DESC, updated_at DESC
  3. For each memory, estimate token count (chars / 4 approximation, or tiktoken)
  4. Add memories to injection list until budget is filled
  5. If next memory doesn't fit, try smaller ones (knapsack)
  6. Return injection list + total tokens used

Key rule: NEVER exceed budget. If budget = 100 and best memory = 120, skip it.
```

### Memory Lifecycle

```
STORE    → App/LLM explicitly stores a memory via tool/API
RANK     → Score by priority + confidence + recency
BUDGET   → Calculate available token space
INJECT   → Insert top memories into LLM context
LEARN    → Optionally update confidence from outcomes
EXPIRE   → TTL-based cleanup of stale memories
```

**Conservative learning**: Memories are stored explicitly (via tool calls or API), not auto-extracted from every LLM response. This avoids the garbage-in problem.

---

## Stateful RAG — Core Differentiator

Traditional RAG is stateless: `query → vector search → dump chunks → hope`. Every retrieval starts from scratch with no understanding of what matters.

**Stateful RAG** is our approach: structured memories with priority, confidence, TTL, and budget-aware retrieval. Memories have lifecycle — they're not static embeddings.

### Three Core Endpoints

| Endpoint | Purpose | Target Latency |
|----------|---------|----------------|
| **STORE** | Extract + persist memories | < 5ms (rules) / async (model) |
| **RETRIEVE** | Recall relevant memories, budget-aware | < 10ms |
| **LEARN** | System self-improves from outcomes | Phase 2 |

### Two-Layer Extraction Pipeline

```
Input (conversation turn)
         │
         ▼
┌──────────────────────────┐
│  Layer 1: Rule-Based      │  ← Always runs, ~2ms, zero dependencies
│  (regex, patterns, heuristics)
│  Catches: code blocks, URLs, error messages,
│  explicit "remember this", structured data,
│  key-value pairs, decisions ("we decided to...")
└────────────┬─────────────┘
             │
             ▼ (if extraction model configured)
┌──────────────────────────┐
│  Layer 2: Small Model     │  ← Optional, runs ASYNC (background)
│  (7B-13B parameter model) │  200-500ms local, 100-300ms via API
│                            │
│  Prompt: "Extract key facts, decisions, entities,
│  and patterns. Return structured JSON with
│  namespace, type, key, value, priority."
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  Deduplication + Merge    │  ~1ms
│  (namespace + type + key) │  Update existing or insert new
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  SQLite STORE             │  ~1ms (WAL mode)
└──────────────────────────┘
```

**Key design**: Layer 1 (rules) is instant and works offline. Layer 2 (model) adds intelligence but runs async — it never blocks the main request. Users can start with rules only and add a model when ready.

### Bring Your Own Model (BYOM)

The extraction model is pluggable. Users choose what works for them:

| Source | Example | Cost | Latency | Offline? |
|--------|---------|------|---------|----------|
| **Free API** | Groq (Llama 3), OpenRouter free tier, Together.ai | $0 | 100-300ms | No |
| **Paid API** | OpenAI (gpt-4o-mini), Anthropic (haiku), Google | $$$ | 100-500ms | No |
| **Local model** | Ollama, llama.cpp, Docker Model Runner | $0 | 200-500ms | Yes |
| **No model** | Rule-based extraction only | $0 | ~2ms | Yes |

A developer on a plane with no internet can still extract and retrieve memories using rule-based extraction + SQLite. Add Ollama with a 7B model on their laptop and they get smart extraction too — fully offline.

### Why "Stateful"

Traditional RAG has no state — every query is independent. Our memories are stateful:

| Property | Traditional RAG | Stateful RAG (Ours) |
|----------|----------------|---------------------|
| Storage | Vector embeddings of chunks | Structured JSON with schema |
| Priority | None (just similarity score) | Explicit 1-10 priority |
| Confidence | None | 0.0-1.0, decays if contradicted |
| Expiration | None (grows forever) | TTL-based, stale context expires |
| Budget | None (dump until overflow) | Token-budget-aware, never exceeds |
| Queryability | Similarity search only | SQL queries, FTS5, exact key lookup |
| Debuggability | Opaque embeddings | Human-readable JSON |
| Lifecycle | Static | Store → Rank → Budget → Inject → Learn → Expire |

### Performance Targets

```
STORE (rule-based):     ~5ms total
  Parse input:          ~1ms
  Rule matching:        ~2ms
  SQLite INSERT:        ~1ms
  Dedup check:          ~1ms

STORE (with model):     ~5ms sync + async background
  Rule-based store:     ~5ms (immediate, non-blocking)
  Model extraction:     200-500ms (async, background worker)
  Model results store:  ~1ms (when async completes)

RETRIEVE:               ~5-10ms total
  SQLite query:         ~1ms (indexed)
  Priority sort:        ~1ms (in-memory)
  Token budgeting:      ~2-5ms (char estimate or tiktoken WASM)
  Format response:      ~1ms
```

### How This Connects to the Proxy

```
App sends request to proxy
         │
    ┌────┴─────┐
    │ RETRIEVE  │  ← ~10ms: query tenant's memories, budget-aware
    └────┬─────┘
         │
    ┌────┴──────────┐
    │ INJECT into    │  ← ~1ms: prepend to system prompt
    │ LLM request    │
    └────┬──────────┘
         │
    ┌────┴─────┐
    │ FORWARD   │  ← Standard LLM API call
    │ to provider│
    └────┬─────┘
         │
    ┌────┴─────┐
    │ STREAM    │  ← Response streams back to app immediately
    │ response  │
    └────┬─────┘
         │
    ┌────┴─────┐
    │ STORE     │  ← ASYNC: extract memories from response (background)
    │ (async)   │     Does NOT block the streaming response
    └──────────┘
```

Total added latency to the critical path: **< 15ms** (retrieve + inject). Model-based extraction happens after the response, in the background.

---

## Project Planning Structure (Needed)

This project needs proper planning before implementation:

### Documents to Write

| Document | Purpose |
|----------|---------|
| **PRD** (Product Requirements Document) | What we're building, for whom, success metrics |
| **SRS** (Software Requirements Specification) | Detailed functional + non-functional requirements |
| **Architecture Design** | System design, data flow, component interactions |
| **API Specification** | REST API, MCP tools, proxy endpoints (OpenAPI spec) |
| **Database Design** | Schema, migrations, indexing strategy |
| **Security Design** | Tenant isolation, encryption, auth, API keys |
| **Deployment Guide** | Local, Docker, cloud, edge deployment options |
| **Domain Templates Catalog** | Starter schemas for common domains |

### Epics

| Epic | Scope |
|------|-------|
| **E1: Core Memory Engine** | SQLite store, CRUD, FTS, TTL expiration |
| **E2: Token Budget Manager** | Model-aware token counting, priority injection |
| **E3: MCP Server** | Tools (store/recall/list/delete), resources, prompts |
| **E4: REST API** | HTTP server, auth, rate limiting, CRUD endpoints |
| **E5: API Proxy** | Transparent proxy for OpenAI/Anthropic/Google APIs |
| **E6: Dashboard UI** | Web UI for memory browsing, search, editing |
| **E7: Domain Templates** | Starter schemas for software, healthcare, legal, etc. |
| **E8: CLI** | Command-line memory management |
| **E9: SDKs** | Node.js, Python, Go client libraries |
| **E10: Cloud/SaaS** | Hosted version, billing, team features |

### Tech Stack (Proposed)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Core Engine | Node.js (or Rust for performance) | SQLite bindings, fast I/O |
| Database | SQLite (per-tenant) | Zero infra, runs everywhere |
| API Server | Fastify or Hono | Lightweight, fast |
| Proxy | Hono / custom HTTP | Streaming support critical |
| Dashboard | React + Vite | Reuse Claudex patterns |
| Token Counter | tiktoken (WASM) or char-estimate | Model-aware counting |
| CLI | Commander.js or yargs | Standard Node CLI |
| Docker | Alpine-based | Small images for edge |

---

## Competitive Advantage

| Feature | Mem0 | SuperMemory | Zep | **This Project** |
|---------|------|-------------|-----|-------------------|
| Domain-agnostic | Generic | Generic | Generic | **Yes + domain templates** |
| Self-hostable | Partial | No | Partial | **Yes (full, open source)** |
| Structured memory | Vector only | Vector only | Vector only | **Structured JSON (SQLite)** |
| Token budgeting | No | No | No | **Yes (model-aware)** |
| Tenant isolation | Shared DB | N/A | Shared DB | **Own DB per tenant** |
| MCP native | No | No | No | **Yes** |
| API proxy mode | No | No | Yes | **Yes (multi-provider)** |
| Runs offline | No | No | No | **Yes** |
| Edge/embedded | No | No | No | **Yes (SQLite)** |
| Open source | Partial | Yes | Partial | **Yes (MIT)** |
| Stateful RAG | No | No | No | **Yes (priority + confidence + TTL)** |
| BYOM extraction | No (proprietary) | No | No | **Yes (any model or none)** |
| Offline capable | No | No | No | **Yes (rules + local model)** |

---

## Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 1 tenant, 1000 memories, basic budgeting, MCP + REST |
| **Pro** | $9/mo | Unlimited tenants, unlimited memories, proxy mode, advanced budgeting |
| **Team** | $29/mo/seat | Shared memories, audit logs, SSO, priority support |
| **Enterprise** | Custom | On-premise, custom extractors, SLA, dedicated support |

---

## Deployment Targets

- **Laptop/Desktop**: `npx @project/memory start` — SQLite, zero deps
- **Docker**: `docker run -v ./data:/data project/memory` — portable
- **Server**: Systemd service or PM2 — production use
- **Cloud**: Managed SaaS (Phase 4)
- **Edge**: ARM64 support, minimal footprint (SQLite + single binary possible with Rust)

---

## Open Questions

1. **Project name?** — Needs a memorable, domain-neutral name
2. **Rust or Node.js?** — Rust for performance + single binary, Node for speed of development
3. **Tokenizer choice?** — tiktoken WASM vs. approximation vs. model-specific
4. **Memory conflict resolution?** — When two sources contradict, which wins?
5. **Proxy streaming?** — How to inject memories while streaming responses?
6. **Default extraction model?** — Which free/small model to recommend for BYOM?

---

## Next Steps

1. Choose project name and create repository
2. Write PRD and SRS
3. Design API specification (OpenAPI)
4. Implement E1 (Core Memory Engine) + E2 (Token Budget Manager)
5. Implement E3 (MCP Server) — prove concept with Claude Code
6. Implement E4 (REST API) + E5 (API Proxy)
7. Build E6 (Dashboard) — reuse Claudex UI patterns
8. Write domain templates (E7)
9. Launch beta

---

*This document is a living vision. Separate PRD/SRS/Architecture docs will follow.*

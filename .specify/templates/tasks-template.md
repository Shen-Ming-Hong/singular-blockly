---
description: 'Task list template for feature implementation'
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: Can run in parallel (different files, no dependencies)
-   **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
-   Include exact file paths in descriptions

## Path Conventions

-   **Single project**: `src/`, `tests/` at repository root
-   **Web app**: `backend/src/`, `frontend/src/`
-   **Mobile**: `api/src/`, `ios/src/` or `android/src/`
-   Paths shown below assume single project - adjust based on plan.md structure

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 0: Research & Verification (MCP-Powered)

**Purpose**: Validate library compatibility, gather authoritative documentation, and ensure testable design

**⚠️ CRITICAL**: Complete this phase before any implementation to ensure decisions are based on current information

-   [ ] T000 [P] Use MCP `resolve-library-id` to find relevant library documentation
-   [ ] T001 [P] Use MCP `get-library-docs` to verify API signatures and compatibility
-   [ ] T002 [P] Search web for breaking changes, migration guides, and best practices
-   [ ] T003 Document research findings in research.md or inline comments
-   [ ] T004 Verify all third-party library versions are compatible with current project
-   [ ] T005 [P] Design architecture for 100% test coverage (identify pure functions, side effects, module boundaries)
-   [ ] T006 [P] Identify and eliminate potential infinite loops or blocking operations in testable code

**Checkpoint**: Research and design validation complete - proceed with informed, testable implementation

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

-   [ ] T005 Create project structure per implementation plan
-   [ ] T006 Initialize [language] project with [framework] dependencies
-   [ ] T007 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

-   [ ] T008 Setup database schema and migrations framework
-   [ ] T009 [P] Implement authentication/authorization framework
-   [ ] T010 [P] Setup API routing and middleware structure
-   [ ] T011 Create base models/entities that all stories depend on
-   [ ] T012 Configure error handling and structured logging infrastructure (use `log.*` methods)
-   [ ] T013 Setup environment configuration management
-   [ ] T014 [P] Establish testing infrastructure with 100% coverage target and safe test patterns
-   [ ] T015 [P] Setup dependency injection framework for testable module boundaries

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

-   [ ] T014 [P] [US1] Contract test for [endpoint] in tests/contract/test\_[name].py
-   [ ] T015 [P] [US1] Integration test for [user journey] in tests/integration/test\_[name].py

### Implementation for User Story 1

-   [ ] T016 [P] [US1] Create [Entity1] model as pure functions in src/models/[entity1].py
-   [ ] T017 [P] [US1] Create [Entity2] model as pure functions in src/models/[entity2].py
-   [ ] T018 [US1] Implement [Service] with separated pure logic and side effects in src/services/[service].py (depends on T016, T017)
-   [ ] T019 [US1] Implement [endpoint/feature] in src/[location]/[file].py with testable design
-   [ ] T020 [US1] Add validation and error handling with 100% test coverage
-   [ ] T021 [US1] Add structured logging for user story 1 operations (use `log.info`, `log.error`, etc.)
-   [ ] T022 [US1] Verify 100% test coverage for all user story 1 code paths

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

-   [ ] T022 [P] [US2] Contract test for [endpoint] in tests/contract/test\_[name].py
-   [ ] T023 [P] [US2] Integration test for [user journey] in tests/integration/test\_[name].py

### Implementation for User Story 2

-   [ ] T024 [P] [US2] Create [Entity] model as pure functions in src/models/[entity].py
-   [ ] T025 [US2] Implement [Service] with separated pure logic and side effects in src/services/[service].py
-   [ ] T026 [US2] Implement [endpoint/feature] in src/[location]/[file].py with testable design
-   [ ] T027 [US2] Integrate with User Story 1 components (if needed) maintaining testability
-   [ ] T028 [US2] Verify 100% test coverage for all user story 2 code paths

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

-   [ ] T029 [P] [US3] Contract test for [endpoint] in tests/contract/test\_[name].py
-   [ ] T030 [P] [US3] Integration test for [user journey] in tests/integration/test\_[name].py

### Implementation for User Story 3

-   [ ] T031 [P] [US3] Create [Entity] model as pure functions in src/models/[entity].py
-   [ ] T032 [US3] Implement [Service] with separated pure logic and side effects in src/services/[service].py
-   [ ] T033 [US3] Implement [endpoint/feature] in src/[location]/[file].py with testable design
-   [ ] T034 [US3] Verify 100% test coverage for all user story 3 code paths

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

-   [ ] TXXX [P] Documentation updates in docs/
-   [ ] TXXX Code cleanup and refactoring per constitution principles (simplicity, modularity, pure functions)
-   [ ] TXXX Performance optimization across all stories
-   [ ] TXXX [P] Additional unit tests (if requested) targeting 100% coverage in tests/unit/
-   [ ] TXXX Security hardening
-   [ ] TXXX Verify structured logging is used consistently throughout codebase
-   [ ] TXXX Verify all code achieves 100% test coverage target
-   [ ] TXXX Confirm no infinite loops or blocking operations in test suite
-   [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: No dependencies - can start immediately
-   **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
-   **User Stories (Phase 3+)**: All depend on Foundational phase completion
    -   User stories can then proceed in parallel (if staffed)
    -   Or sequentially in priority order (P1 → P2 → P3)
-   **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

-   **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
-   **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
-   **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

-   Tests (if included) MUST be written and FAIL before implementation
-   Models before services
-   Services before endpoints
-   Core implementation before integration
-   Story complete before moving to next priority

### Parallel Opportunities

-   All Setup tasks marked [P] can run in parallel
-   All Foundational tasks marked [P] can run in parallel (within Phase 2)
-   Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
-   All tests for a user story marked [P] can run in parallel
-   Models within a story marked [P] can run in parallel
-   Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
    - Developer A: User Story 1
    - Developer B: User Story 2
    - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

-   [P] tasks = different files, no dependencies
-   [Story] label maps task to specific user story for traceability
-   Each user story should be independently completable and testable
-   Verify tests fail before implementing
-   Commit after each task or logical group
-   Stop at any checkpoint to validate story independently
-   Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

You are an AI assistant working on a backend codebase that follows a Modular Monolith architecture using Node.js, Express.js, MongoDB, and TypeScript.

These rules are STRICT and MUST be followed at all times.  
Additionally, you must respect ESLint and Prettier configuration and enforce formatting, import order, and TypeScript strict rules.

============================
ARCHITECTURE PRINCIPLES
============================

- The project uses a Modular Monolith (Domain-based) architecture.
- The repository is a single repo with clear domain boundaries.
- Every domain must be independently extractable into a microservice in the future.
- Domain boundaries must NEVER be violated.

============================
MODULE OWNERSHIP
============================

- Each business domain is implemented as an isolated module inside `src/modules`.
- Every module MUST contain its own:
  - model
  - controller
  - service
  - route
  - validator (Joi)
  - types/interfaces
- MongoDB models MUST live ONLY inside their respective modules.
- No module is allowed to directly access another module’s database layer.

============================
CROSS-MODULE COMMUNICATION
============================

- Direct imports of models from other modules are STRICTLY FORBIDDEN.
- Modules may interact ONLY through:
  - exposed service methods
  - shared interfaces (DTOs)
- Only ID references (e.g., userId) are allowed across modules.
- Circular dependencies between modules are NOT allowed.

FORBIDDEN:

- Importing models from another module
- Sharing Mongoose schemas across modules

============================
FOLDER STRUCTURE RULES
============================

- All domain logic MUST live inside `src/modules`.
- Shared logic MUST live inside `src/shared`.
- `src/shared` may contain ONLY:
  - interfaces
  - constants
  - generic utilities
- `src/shared` must NEVER contain:
  - business logic
  - domain-specific logic
  - database models

============================
VALIDATION RULES (JOI)
============================

- Joi is the ONLY validation library allowed.
- Validation schemas MUST be defined inside each module’s validator file.
- Validation MUST execute before controller logic.
- Controllers must assume data is already validated.
- Validation errors must follow a consistent error format.

============================
CONTROLLER RULES
============================

- Controllers MUST be thin.
- Controllers may ONLY:
  - receive validated input
  - call service methods
  - return HTTP responses
- Controllers MUST NOT:
  - contain business logic
  - access database models directly
  - perform validation

============================
SERVICE RULES
============================

- Services contain ALL business logic.
- Services may access:
  - models within the same module
  - shared utilities
- Services MUST NOT:
  - return HTTP responses
  - depend on Express request/response objects

============================
MODEL RULES (MONGODB)
============================

- Each module owns its MongoDB models.
- Models MUST NOT be shared across modules.
- Cross-domain relationships MUST be handled using IDs only.
- Do NOT use Mongoose population across domains.

============================
MIDDLEWARE RULES
============================

- All middlewares must live in `src/middlewares`.
- Middlewares must be generic and reusable.
- Auth middleware MUST NOT contain business logic.
- Error handling MUST be centralized.

============================
TYPESCRIPT RULES
============================

- TypeScript strict mode MUST remain enabled.
- Avoid using `any`.
- Each module defines its own domain types.
- Shared DTOs and contracts live in `src/shared/interfaces`.
- Use path aliases (`@modules`, `@shared`).
- Do NOT define inline interfaces within models, services, or controllers.
- All interfaces MUST be declared in each module’s `.types.ts` file and imported where used.

============================
ESLINT + PRETTIER CONTEXT
============================

- ESLint MUST be used for all TypeScript files in `src/**/*.ts`.
- Prettier MUST be used for formatting and consistency.
- Enforce:
  - no console logs in production
  - no unused variables
  - consistent import order
  - no cross-module model imports
  - strict TypeScript rules
- Use Prettier for:
  - semi-colons
  - single quotes
  - tab width = 2
  - trailing commas
  - max line length = 100
- All ESLint + Prettier rules MUST be respected in code generation and suggestions.
- Any violation of formatting or lint rules MUST be flagged.

============================
ERROR HANDLING RULES
============================

- All errors MUST be handled by centralized error middleware.
- Services should throw domain-specific errors.
- Controllers must NOT format error responses manually.

============================
ENVIRONMENT & CONFIG
============================

- No hardcoded secrets.
- Environment variables must be accessed via config files.
- `.env` must never be committed.
- `.env.example` must be kept up to date.

============================
CODE QUALITY RULES
============================

- Follow Single Responsibility Principle.
- Keep modules small and focused.
- Use meaningful naming.
- Avoid tight coupling.

============================
FUTURE-PROOFING
============================

- Always design modules as independently deployable services.
- Avoid assumptions about other modules’ internal implementations.
- Prefer interfaces/events for future integrations.

============================
GOLDEN RULE
============================
If a module cannot be extracted into its own microservice with minimal changes, the implementation is WRONG.

Dont Add Any Testing Script mongoose.connection.db.dropDatabase();

You are an AI assistant working on a Node.js + Express.js + TypeScript backend following a Modular Monolith architecture.

These rules are STRICT and MUST be followed at all times.  
This is a **standalone rule set** for API responses, Swagger, validation, and response middleware enforcement.  
It is independent from architecture.md rules.

============================
COMMON API RESPONSE
============================
- All API responses MUST follow a standard interface:

```ts
export interface IApiResponse<T = unknown> {
    status: boolean;
    code: number;
    message?: string;
    data?: T;
    errors?: IApiError[];
    validationMessages?: string[];
    total?: number;
}

export interface IApiError {
    code: string;
    message: string;
}
Services MUST return only data or errors; they MUST NEVER send responses directly.

Controllers MUST pass service results to a dedicated response middleware.

Response middleware MUST format responses into IApiResponse.

Validation errors from Joi MUST populate validationMessages.

Domain/service errors MUST populate the errors array.

Client MUST receive responses only through response middleware.

============================
RESPONSE MIDDLEWARE
All client responses MUST pass through a single, reusable response middleware.

Response middleware MUST handle:

formatting the response

setting correct HTTP status codes

logging errors if necessary

Controllers MUST never call res.send / res.json directly.

Services MUST NOT access Express objects.

============================
SWAGGER / OPENAPI
Every route MUST have proper Swagger/OpenAPI documentation.

Swagger MUST reflect the IApiResponse structure.

Request parameters, request bodies, and responses MUST be clearly documented.

Swagger documentation MUST be kept up-to-date with code changes.

Route definitions MUST include proper HTTP status codes for success and error responses.

============================
CONTROLLER & SERVICE RULES
Controllers:

Must be thin

Must receive validated input

Must call services

Must never return responses directly

Services:

Contain all business logic

May return data or throw domain-specific errors

Must never handle HTTP responses

Controllers and services MUST remain independent of Express response objects.

============================
VALIDATION RULES
Joi MUST be used for request validation.

Validation MUST occur before controllers are invoked.

Validation errors MUST populate validationMessages in the response middleware.

============================
CODE QUALITY & CONSISTENCY
Responses MUST be consistent across all modules.

Status codes MUST follow HTTP standards.

Error codes MUST be meaningful and consistent.

No hardcoded messages in controllers or services.

Follow Single Responsibility Principle in controllers, services, and middlewares.

Ensure separation of concerns: controllers → services → response middleware.

============================
GOLDEN RULE
All responses sent to clients MUST go through the response middleware in IApiResponse format.

Any direct response from a controller or service is WRONG.

Swagger documentation MUST always reflect the actual response structure.
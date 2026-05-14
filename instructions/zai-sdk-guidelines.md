# Z.ai SDK Usage Guidelines

## Core Principle

z-ai-web-dev-sdk is a backend-only dependency. Never import or use it in client-side code.

---

## Mandatory Patterns

### Chat Completions

- Always include a system prompt to control model behavior
- Set explicit temperature and max_tokens for predictable results
- Handle streaming responses for long outputs
- Validate response structure before rendering
- Use lower temperature (0.3-0.5) for factual/code tasks
- Use higher temperature (0.7-0.9) for creative tasks

### Image Generation

- Use the CLI tool `z-ai-generate` for static assets (favicons, logos, backgrounds)
- Use the SDK for dynamic image generation (user-triggered)
- Supported sizes: 1024x1024, 768x1344, 864x1152, 1344x768, 1152x864, 1440x720, 720x1440
- Always save generated images to /home/z/my-project/download/
- Keep image prompts descriptive for better generation quality
- Never store base64 image data in React state

### Web Search

- Use `zai.functions.invoke("web_search", { query, num })` for real-time data
- Maximum 10 results per query
- Parse the SearchFunctionResultItem array for URL, name, snippet, host_name, rank, date, favicon
- Cache results when appropriate to reduce API calls
- Simplify overly specific queries if results are empty

### Error Handling

- Wrap ALL SDK calls in try/catch
- Apply api-retry logic for transient errors (502, 503, 504)
- Log failures to worklog.md
- Never expose SDK error details to end users
- Return generic error messages to the client

---

## Prohibited

- Importing z-ai-web-dev-sdk in client components or pages
- Hardcoding API keys or tokens
- Making SDK calls in useEffect hooks
- Storing base64 image data in state (use file system or object URLs)

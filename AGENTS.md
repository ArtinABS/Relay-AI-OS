<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository instructions

## Commit messages

Use Conventional Commits for every commit, matching the repository's existing
history and commitlint configuration:

```text
<type>(<optional scope>)!: <lowercase imperative subject>
```

The scope and breaking-change marker are optional. Keep the subject concise,
lowercase, and imperative. Examples:

```text
feat(admin): add competition management
fix(auth): reject expired tokens
chore(deploy): update deployment settings
```

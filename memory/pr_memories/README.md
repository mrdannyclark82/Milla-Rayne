# PR Memory Storage

This folder stores Pull Request conversations and context separately from general memories.

## Structure

Each PR conversation is stored in a separate JSON file:
- `pr-{number}.json` - Contains messages and metadata for PR #{number}

## Format

```json
{
  "prNumber": 123,
  "title": "PR Title",
  "repository": "owner/repo",
  "createdAt": "2025-01-01T00:00:00Z",
  "messages": [
    {
      "role": "user",
      "content": "Message content",
      "timestamp": "2025-01-01T00:00:00Z"
    }
  ]
}
```

## Purpose

Separating PR memories allows Milla to:
- Maintain context specific to each PR
- Keep PR discussions separate from personal conversations
- Easily reference past PR conversations
- Track progress on different PRs independently

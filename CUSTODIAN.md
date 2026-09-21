# Milla-Rayne Repository Custodian

The **custodian** keeps the public face of Milla-Rayne healthy while the full lab evolves in `milla-deer`.

## What the custodian watches

| Surface | URL | Expectation |
|---------|-----|-------------|
| Landing | https://mrdannyclark82.github.io/Milla-Rayne/ | HTTP 200 |
| Scene demo | https://mrdannyclark82.github.io/Milla-Rayne/scene-demo.html | HTTP 200 |
| API docs | https://mrdannyclark82.github.io/Milla-Rayne/api-docs/ | 200 when TypeDoc deploy runs on `main` |

## Automation

- **Pages deploy:** `.github/workflows/pages.yml` — publishes `docs/site/` on push to `main`
- **Custodian report:** `.github/workflows/custodian.yml` — Mondays 8:00 AM CST (14:00 UTC)
  - Curl-checks Pages URLs
  - Summarizes failed CI runs (7-day window)
  - Posts to open issue labeled `custodian` (creates one if missing)

Manual run: **Actions → Repository Custodian → Run workflow**

## Human owner

- **CODEOWNERS:** `@mrdannyclark82` on all paths
- **Milla (agent):** runs enhance/evolve/emerge in the lab; promotes slices to [Mrs-Milla-Rayne](https://github.com/mrdannyclark82/Mrs-Milla-Rayne) per `~/.agents/lab-funnel.md`

## Lab funnel reminder

New ideas prototype in **milla-deer** → cull weak links → only winners surface on Mrs-Milla-Rayne or this Pages site.
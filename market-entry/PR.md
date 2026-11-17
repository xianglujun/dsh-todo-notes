# Pull request for the plugin market

Submit this to [awesome-dsh-plugin/awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
as a PR that adds **one file**:

```
data/plugins/xianglujun__dsh-todo-notes.yml
```

The file to use is `market-entry/xianglujun__dsh-todo-notes.yml` in this repository — copy its
content verbatim and place it at that path.

**Title**

```
Add xianglujun/dsh-todo-notes
```

**Body**

```markdown
- [x] I added **one file** at `data/plugins/xianglujun__dsh-todo-notes.yml` — that single file is the whole submission.
- [x] My repo's `package.json` declares **`dsh.bundle`** (`dsh.bundle.patch: ./cordis.patch.yml`, plus `dsh.client` for the browser half).
- [ ] My repo is at least **1 day old** — created 2026-11-17T13:01:36Z.
- [x] `category: workflow` — it is a day-grouped to-do and work-log page.
- [x] Description states what the plugin does, no superlatives.
- [x] My repo has the `dsh-plugin` topic.

`dsh-todo-notes` adds one entry to the left sidebar for logging what you did each day. Entries nest
as parent and child, carry an automatic colour label and tags, and are listed in unfinished and
completed tabs grouped by day. Each entry can hold links, a multi-line progress note shown as a
timeline, and a 0-100% progress value; a calendar tab files an entry on any date, and an overview
tab shows the day's totals, a seven-day chart, six page themes and an editable daily summary that
lists work in progress separately, for writing a report.

Storage is a local SQLite database (`node:sqlite`, WAL), written one changed row at a time: writing
one changed entry against a 20,000-entry database takes about 0.5 ms and stays flat as the list
grows. An older JSON data directory is imported once and kept as `*.imported-bak`; if `node:sqlite`
is unavailable the plugin falls back to JSON snapshot and journal files and says so in the page
header. No third-party dependency, no network, no API key.

The repository ships `publish-check.mjs`, which gates the manifest, the loader patch, the locale
files, the detail document, the artwork and this entry, and runs from `prepublishOnly`.
```

## Before opening the PR

- **Add the `dsh-plugin` topic** to the repository: on the repo page, the gear beside **Topics**.
  CI checks it.
- **The 1-day repository-age gate.** The repository was created 2026-11-17T13:01:36Z, so the gate
  clears at **2026-11-18T13:01:36Z (2026-11-18 21:01 +08:00)**. Opening the PR earlier is not fatal —
  the guide says the verdict is a snapshot that re-runs by itself — but waiting avoids a review
  cycle on a submission that is already known to pass.
- **Only ever edit your own entry.** If a later update is needed, change
  `data/plugins/xianglujun__dsh-todo-notes.yml` and push to the same branch; do not hand-edit the
  generated READMEs.

## Optional extras

- **Screenshots.** Add a `screenshots.json` next to `package.json` in this repository listing 1-8
  image paths (relative, inside the repository). Storefronts then show those instead of guessing
  from the README.
- **npm.** `npm publish` from this directory links the npm package to the repository automatically,
  provided the `repository` field in `package.json` points here (it does). No field is added to the
  entry, and a hand-written `npm:` key is rejected.

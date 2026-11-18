# dsh-todo-notes

A to-do and quick-note page for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), for logging what you did each day.

It adds one entry to the left sidebar. Open it and you get a full-width page with four tabs —
**Unfinished / Completed / Calendar / Overview** — and everything you write stays on your machine.

## What it does

**Entries.** Add, edit and delete entries in place. Entries nest as parent and child, with expand
and collapse. Each one gets a colour from an eight-colour palette, and can carry tags.

**Day-grouped lists.** The Unfinished and Completed tabs are grouped by day, newest group first,
with unfinished entries always ahead of finished ones. An entry whose day is older than today is
marked as carried over (`结转 N 天`) and can be moved to today with one click. A tag filter row
sits above the list.

**Looking an entry up.** A magnifier sits at the right end of the filter row; clicking it grows a
search field beside that spot, on the same line, so nothing above the list moves. It narrows both
tabs by content: an entry matches when the term appears in its text, its tags, its links or its
notes, ignoring case. The field stays open while a term is active, so an active filter is never
invisible. It combines with the tag filter, reports how many entries matched, says so when nothing
does, and clears and puts itself away on Esc or the ×.

**Progress.** Any entry can carry a 0–100% value. Below 100% the bar uses the page accent colour;
at 100% it turns green and the entry counts as done. Setting the value back below 100% reopens it,
so the checkbox and the percentage never disagree.

**Links.** Paste a whole line such as `https://example.com/task/ABC-1 《some title》` and the
address is extracted while the rest becomes the title. Bare hosts get `https://` added; only
http/https is accepted.

**Progress notes.** A multi-line note per entry, shown as a compact timeline. Enter inserts a
newline, Ctrl+Enter (Cmd+Enter on macOS) adds it. Notes and links are added right on the card,
without opening the editor. An existing note is rewritten in place: the ✎ beside it in the
timeline, or in the entry's editor, turns it into a box with Save and Cancel, keeping the time it
was written. Deleting a note is the × in the entry's editor.

**Calendar.** A month grid. One click on any day files a new entry under that date, and lists that
day's entries underneath.

**Daily summary.** The Overview tab holds an editable summary of the day — what was completed with
times, what is still in progress with its percentage, what is still owed, and a tag tally. Copy it,
save your own version, or hand the day's records to the session agent to write up. Entries with
progress appear in their own section, which is what makes the summary usable for a daily report.

**Overview.** Totals for the day (recorded / completed / still owed / completion rate) with a rate
bar, a seven-day chart, the tag distribution, and six page themes.

**From the conversation.** A button beside the chat composer files the current conversation as an
entry, or attaches it to an existing one, so you can trace an entry back to the session it came
from.

## Install

Install it from the DSH plugin market. To add it by hand, use **Plugins → Add plugin** in DSH and
point it at this package directory.

The plugin builds nothing and has no third-party dependencies: `index.js` is the host half,
`client.js` is the browser half, and both are plain JavaScript shipped in the repository.

## Where your data lives

Everything is stored in a SQLite database on this machine. The default directory is
`<DSH_HOME>/todo-notes/data`; change it in the page's status row, and any existing data moves with
it. Nothing is uploaded, and no API key is needed.

The database is `todos.db`, in WAL mode, with four tables:

| table | holds |
| --- | --- |
| `items` | one row per entry — the entry document as JSON, plus `day`, `created_at`, `done` and `progress` as indexed columns |
| `notes` | the daily summary you saved for each day |
| `events` | the activity log, queryable by day |
| `meta` | bookkeeping, such as whether the directory was imported |

`todos.db-wal` and `todos.db-shm` are SQLite's normal sidecar files. Do not delete them by hand;
changing the data directory moves them along with the database.

**Upgrading from an older version.** If the directory still holds the older `todos.json`,
`journal.jsonl` and `history.jsonl`, they are read once on first open (snapshot plus journal
replay), written into the database, and then renamed to `*.imported-bak` — kept, not deleted. The
page reports how many entries were imported. To go back, rename them again and delete `todos.db`.

## Storage and performance

A save sends only the entries that changed, and the host applies them in one transaction with
prepared statements, so the write cost tracks the size of the edit rather than the size of the
list. Measured on a 20,000-entry database: writing one changed entry takes about 0.5 ms and stays
flat as the list grows.

The database uses Node's built-in `node:sqlite`, so there is nothing to install. If a runtime does
not provide it, or the database file cannot be opened, the plugin falls back to JSON snapshot and
journal files and says so in the page header; the feature keeps working either way.

## Known boundaries

- Data stays on one machine: there is no sync, no import/export, no reminders or repeats, and no
  drag-to-reorder.
- The daily summary is a text template, not model-generated. Use **hand it to the agent** to have
  the session write it up.
- Limits per entry: 12 tags, 24 links, 60 notes, and 2000 characters per note.
- Progress is tied to completion: 100% means done, below 100% means open. Clearing the progress
  value does not change the completion state.
- Tag colours come from the same eight-colour palette, assigned by hashing the tag name, so two
  tags can share a colour; the text distinguishes them.
- Opening the page loads the whole list into memory, which is fine for tens of thousands of
  entries.

## Uninstall

Removing the bundle takes away the sidebar page, the composer button and the styles. Your data is
not deleted — reinstall and it is still there.

## License

MIT — see [LICENSE](LICENSE).

---

## 中文简介

左侧菜单里的「待办与随手记」：按天记录你做了什么。条目可就地新增、编辑、删除，支持父子层级、
自动配色与标签；未完成与已完成分页签、按天分组，未完成永远在前，跨天的条目标出「结转 N 天」
可一键移到今天。每条能带链接、多行进度随记（时间线展示）和 0–100% 进度——未到 100% 用主色，
到 100% 转绿并自动计为完成。「日历」页签点某一天就把新条目记到那天；「概览」页签有当天统计、
近 7 天柱状、标签分布、六套主题，以及可改写、可复制、可交给 Agent 的当天小结（设置了进度的条目
单独列出，写日报很方便）。输入框旁边有按钮可把当前会话存成条目。

数据全部保存在本机，默认 `<DSH_HOME>/todo-notes/data`，可改位置并整体搬迁；存储是 SQLite
数据库（`todos.db`，WAL 模式），每次只写改动的行，两万条时改一条约 0.5 毫秒。旧的 JSON 数据会
在首次打开时导入一次，原文件保留为 `*.imported-bak`。不上传数据、不需要 API Key、没有第三方
依赖——数据库用 Node 内置的 `node:sqlite`，不可用时自动回退到 JSON 快照加增量日志。

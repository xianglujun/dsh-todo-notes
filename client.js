/**
 * Browser half of the "待办与随手记" page.
 *
 * Three registrations share one module: the sidebar entry and its panel, the
 * composer control that files what you typed as a to-do, and the panel that
 * control opens below the composer. They all read and write one store, which
 * keeps the durable document in the Host half (`data/todos.json` plus an
 * append-only `data/history.jsonl`) and mirrors it into browser storage so the
 * page still works when the Host routes are unreachable.
 *
 * Everything registered here belongs to the plugin's own context: unloading the
 * plugin removes the styles, the sidebar entry, the panel and the composer
 * control.
 */
window.__ModuleLoader__.load({
  id: '@dsh-local/view-a0796f38-40ab-4c7e-8c72-872b90ddd567',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } = React;

    /** Id shared by the sidebar entry and the main panel it selects. */
    const PANEL_ID = 'a0796f38-40ab-4c7e-8c72-872b90ddd567';
    /** Locale namespace owned by this plugin. */
    const NS = '@dsh-local/view-a0796f38-40ab-4c7e-8c72-872b90ddd567';
    /** Host routes that own the durable document. */
    const ROUTE = '/dsh-todo-notes';
    /** Browser mirror, so the page survives an unreachable Host half. */
    const LOCAL_KEY = 'dsh-created-plugin.a0796f38-40ab-4c7e-8c72-872b90ddd567.todos.v2';
    /** Key the page used before the durable document existed; read once, then migrated. */
    const LEGACY_KEY = 'dsh-created-plugin.a0796f38-40ab-4c7e-8c72-872b90ddd567.todos.v1';
    /** Document version written to the Host. */
    const SCHEMA_VERSION = 3;
    /** Quiet period before a change is written to the Host. */
    const SAVE_DELAY_MS = 400;
    /** Upper bound on the composer panel's target list, so a long history stays fast. */
    const MAX_PICKER_OPTIONS = 300;

    /** The colour labels an entry may carry. */
    const PALETTE = [
      { id: 'gray', value: '#8A8F99' },
      { id: 'red', value: '#E5484D' },
      { id: 'orange', value: '#F76B15' },
      { id: 'amber', value: '#D9A300' },
      { id: 'green', value: '#2F9E44' },
      { id: 'teal', value: '#0C8599' },
      { id: 'blue', value: '#1C7ED6' },
      { id: 'violet', value: '#7048E8' },
    ];

    const ZH = {
      panel: '待办与随手记',
      title: '待办与随手记',
      dayAll: '全部',
      dayToday: '今天',
      dayFilter: '按天筛选',
      pickDay: '选择日期',
      labelToday: '今天',
      labelYesterday: '昨天',
      labelTomorrow: '明天',
      prevDay: '前一天',
      nextDay: '后一天',
      backToday: '回到今天',
      weekdaySun: '星期日',
      weekdayMon: '星期一',
      weekdayTue: '星期二',
      weekdayWed: '星期三',
      weekdayThu: '星期四',
      weekdayFri: '星期五',
      weekdaySat: '星期六',
      statPlanned: '当天记下',
      statDone: '当天完成',
      statOpen: '仍未完成',
      statRate: '完成率',
      quickAddLabel: '记一笔今天做的事，回车保存',
      quickDone: '已经完成',
      openHintCarried: '其中 {count} 条是从更早结转过来的',
      carriedBadge: '结转 {days} 天',
      moveToToday: '移到今天',
      doneAt: '完成于 {time}',
      createdBadge: '记于当天',
      backfillHint: '正在补记 {day} 的记录',
      backfillBadge: '补记',
      showMore: '显示更早的 {count} 天',
      logTo: '记到',
      groupTotal: '共 {count} 条',
      weekNote: '近 7 天：记下 {planned} · 完成 {done}',
      digestToday: '今天 {planned} 记下 · {done} 完成 · {open} 未完成',
      tabOverview: '概览',
      tabCalendar: '日历',
      monthPrev: '上个月',
      monthNext: '下个月',
      monthToday: '回到本月',
      weekShortSun: '日',
      weekShortMon: '一',
      weekShortTue: '二',
      weekShortWed: '三',
      weekShortThu: '四',
      weekShortFri: '五',
      weekShortSat: '六',
      dayLogged: '记下 {count}',
      dayDone: '完成 {count}',
      dayDetail: '{day} 的记录',
      dayDetailEmpty: '这一天没有任何记录。',
      calMore: '还有 {count} 条',
      calAddHint: '点这一天，在下面记一笔',
      techTheme: '科技感主题',
      techThemeHint: '网格底纹、品牌色微光、等宽数字；关掉即回到朴素样式。',
      themeTitle: '页面主题',
      themeHint: '主题只作用于这一页，不改动应用其他地方；浅色/深色各自适配。',
      'theme.tech': '科技',
      'theme.paper': '纸墨',
      'theme.celadon': '护眼绿',
      'theme.mist': '晨雾',
      'theme.contrast': '高对比',
      'theme.plain': '跟随应用',
      progressLabel: '进度',
      progressSet: '设置进度',
      progressClear: '清除进度',
      progressAt: '{percent}%',
      progressInProgress: '进行中',
      summaryProgressHeading: '进行中',
      agentPromptProgress: '进行中：',
      monthLabel: '{year} 年 {month} 月',
      composerMore: '更多',
      composerLess: '收起',
      composerClose: '关闭',
      composerTrigger: '新增一条',
      composerHeadToday: '新增一条待办',
      linksLabel: '链接',
      linkUrl: '粘贴链接，可整行粘贴（含标题）',
      linkTitle: '标题（可选，留空则用粘贴里的）',
      linkAdd: '加链接',
      linkInvalid: '没找到可用链接：可直接粘贴「链接 + 标题」整行，或填 devops.aliyun.com/… 这样的域名（自动补 https://）',
      removeLink: '删除链接',
      logsLabel: '随记',
      logPlaceholder: '写进度随记，可多行（Ctrl+回车添加）',
      logAdd: '加随记',
      logEdit: '编辑这条随记',
      removeLog: '删除这条随记',
      moreLogs: '还有 {count} 条随记',
      logLatest: '最新',
      ageDays: '已 {days} 天',
      ageToday: '今天创建',
      ageTitle: '创建于 {day}',
      editorEdit: '编辑条目',
      editorCreate: '新建子条目',
      entryCreate: '新建条目',
      editorUnder: '归到「{text}」',
      editorRemove: '删除这条',
      summaryTitle: '当天小结',
      summaryAuto: '自动生成，可改写后保存',
      summarySave: '保存小结',
      summarySaved: '已保存',
      summaryCopy: '复制',
      summaryCopied: '已复制',
      summaryReset: '恢复自动',
      summaryAgent: '让 Agent 总结',
      summaryAgentHint: '把这一天的记录交给会话里的 Agent 总结',
      summaryEmpty: '这一天还没有记录。',
      summaryHead: '{day} · 记下 {planned} · 完成 {done} · 仍欠 {open}',
      summaryDoneHeading: '已完成',
      summaryOpenHeading: '仍欠',
      summaryTagsHeading: '标签',
      weekTitle: '近 7 天',
      weekLegendPlanned: '记下',
      weekLegendDone: '完成',
      tagsTitle: '标签',
      tagAuto: '颜色按调色板自动轮换',
      agentPromptHead: '请帮我总结 {day} 这一天的工作，并指出还没完成的事项。',
      agentPromptPlanned: '当天记下：',
      agentPromptDone: '当天完成：',
      agentPromptOpen: '仍未完成：',
      locationTitle: '数据位置',
      locationHint: '数据以「增量日志 + 定期快照」写入，单次保存只追加改动。',
      locationCurrent: '当前目录：{directory}',
      locationChange: '更改…',
      locationPick: '选择文件夹',
      locationReset: '恢复默认',
      locationInvalid: '请填写绝对路径，例如 D:\\notes\\todo',
      locationMoved: '已把 {count} 个数据文件移到新目录',
      locationSkipped: '目标目录已有同名文件，未覆盖：{names}',
      locationDefault: '默认位置',
      locationJournal: '待折叠的增量记录：{count} 条',
      dayHint: '只显示 {day} 新增或完成的条目（连同其父级）',
      counts: '未完成 {active} · 已完成 {done}',
      sectionActive: '未完成',
      sectionDone: '已完成',
      emptyActive: '还没有未完成的条目。',
      emptyDone: '还没有完成的条目。',
      loading: '正在读取本机数据…',
      storageFile: '数据文件：{path}',
      storageHistory: '活动记录：{path}',
      storageBrowser: '读不到主机上的数据文件（{error}），本次改动只保存在这个浏览器里。',
      storageCorrupt: '数据文件当前无法解析，已按空清单打开，磁盘上的原文件没有被覆盖。',
      storageSqlite: 'SQLite 数据库',
      storageJson: 'JSON 快照（回退）',
      storageSqliteHint: '行级增量写入、按天索引：{path}',
      storageSqliteHintDb: '行级增量写入、按天索引：{path}',
      storageFallbackHint: '数据库不可用，已回退到 JSON 存储：{note}',
      storageMigrated: '已从 JSON 导入数据库 {count} 条，原文件备份为 .imported-bak',
      saved: '已保存',
      saving: '保存中…',
      saveFailed: '保存失败：{error}',
      placeholderNew: '写一条待办或随手记，回车保存',
      placeholderChild: '写一条子条目，回车保存',
      placeholderEdit: '修改这条内容',
      add: '添加',
      save: '保存',
      cancel: '取消',
      countToday: '计入当天已完成',
      addChild: '添加子条目',
      edit: '编辑',
      delete: '删除',
      confirm: '确认删除',
      confirmDelete: '删除这条条目？',
      confirmDeleteWithChildren: '删除这条条目及其 {count} 个子条目？',
      expand: '展开子条目',
      collapse: '收起子条目',
      childCount: '{count} 条子条目',
      markDone: '标记为已完成',
      markActive: '标记为未完成',
      tagsLabel: '标签',
      tagPlaceholder: '输入新标签，回车确认',
      tagSuggest: '已有标签，点一下添加',
      tagAll: '全部标签',
      tagFilterLabel: '按标签筛选',
      tagHint: '只看带「{tag}」标签的条目。',
      tagRename: '改名',
      tagRenameHint: '把「{name}」改名为',
      tagRenameSave: '保存',
      tagAutoHint: '颜色由系统按调色板自动轮换分配，保持便签墙有区分度。',
      searchLabel: '按内容查找',
      searchPlaceholder: '查找待办、随记、链接或标签…',
      searchHint: '在条目正文、随记、链接与标签里查找，不区分大小写；按 Esc 清除。',
      searchClear: '清除查找',
      searchHide: '收起查找框',
      searchFound: '找到 {count} 条 ·「{query}」',
      searchEmpty: '没有匹配「{query}」的条目。',
      refLabel: '会话',
      refOpen: '打开这条会话',
      refRemove: '取消与这条会话的关联',
      linkTitle: '存入待办',
      linkHint: '把输入框里的内容存成待办，并关联当前会话',
      linkHeading: '存入待办',
      linkTarget: '保存到',
      linkNew: '新建一条待办',
      linkExisting: '关联到已有条目',
      linkDone: '计入当天已完成',
      linkClear: '保存后清空输入框',
      linkSave: '保存',
      linkCancel: '取消',
      linkDraftEmpty: '先写点内容，或者选一条已有条目。',
      linkMissing: '这条条目已经不在了。',
      linkResultCreated: '已新建「{text}」',
      linkResultLinked: '已关联到「{text}」',
      linkOpenPage: '打开待办页',
      linkClose: '知道了',
      linkNoSession: '当前会话读不到，只保存条目。',
    };

    const EN = {
      panel: 'Todos and quick notes',
      title: 'Todos and quick notes',
      dayAll: 'All',
      dayToday: 'Today',
      dayFilter: 'Filter by day',
      pickDay: 'Pick a date',
      labelToday: 'Today',
      labelYesterday: 'Yesterday',
      labelTomorrow: 'Tomorrow',
      prevDay: 'Previous day',
      nextDay: 'Next day',
      backToday: 'Back to today',
      weekdaySun: 'Sunday',
      weekdayMon: 'Monday',
      weekdayTue: 'Tuesday',
      weekdayWed: 'Wednesday',
      weekdayThu: 'Thursday',
      weekdayFri: 'Friday',
      weekdaySat: 'Saturday',
      statPlanned: 'Logged',
      statDone: 'Completed',
      statOpen: 'Still open',
      statRate: 'Completion',
      quickAddLabel: 'Log something you did, press Enter',
      quickDone: 'Already done',
      openHintCarried: '{count} of them carry over from earlier days',
      carriedBadge: 'carried {days}d',
      moveToToday: 'Move to today',
      doneAt: 'done at {time}',
      createdBadge: 'logged that day',
      backfillHint: 'Logging this entry into {day}',
      backfillBadge: 'backfilled',
      showMore: 'Show {count} earlier days',
      logTo: 'Log into',
      groupTotal: '{count} entries',
      weekNote: 'Last 7 days: logged {planned} · done {done}',
      digestToday: 'today {planned} logged · {done} done · {open} open',
      tabOverview: 'Overview',
      tabCalendar: 'Calendar',
      monthPrev: 'Previous month',
      monthNext: 'Next month',
      monthToday: 'Back to this month',
      weekShortSun: 'S',
      weekShortMon: 'M',
      weekShortTue: 'T',
      weekShortWed: 'W',
      weekShortThu: 'T',
      weekShortFri: 'F',
      weekShortSat: 'S',
      dayLogged: '{count} logged',
      dayDone: '{count} done',
      dayDetail: 'Record of {day}',
      dayDetailEmpty: 'Nothing recorded on this day.',
      calMore: '{count} more',
      calAddHint: 'Click this day to add an entry below',
      techTheme: 'Tech theme',
      techThemeHint: 'Grid backdrop, accent glow, monospace figures; switch it off for the plain look.',
      themeTitle: 'Page theme',
      themeHint: 'Themes apply to this page only and never touch the rest of the app; each adapts to light and dark.',
      'theme.tech': 'Tech',
      'theme.paper': 'Paper',
      'theme.celadon': 'Celadon',
      'theme.mist': 'Morning mist',
      'theme.contrast': 'High contrast',
      'theme.plain': 'Follow the app',
      progressLabel: 'Progress',
      progressSet: 'Set progress',
      progressClear: 'Clear progress',
      progressAt: '{percent}%',
      progressInProgress: 'In progress',
      summaryProgressHeading: 'In progress',
      agentPromptProgress: 'In progress:',
      monthLabel: '{month}/{year}',
      composerMore: 'More',
      composerLess: 'Less',
      composerClose: 'Close',
      composerTrigger: 'New entry',
      composerHeadToday: 'New entry',
      linksLabel: 'Links',
      linkUrl: 'Paste a link — a whole line with its title is fine',
      linkTitle: 'Title (optional; the pasted one is used when empty)',
      linkAdd: 'Add link',
      linkInvalid: 'No usable link found: paste the whole “link + title” line, or a bare host such as devops.aliyun.com/… (https:// is added)',
      removeLink: 'Remove this link',
      logsLabel: 'Progress notes',
      logPlaceholder: 'Write a progress note, multiple lines allowed (Ctrl+Enter adds it)',
      logAdd: 'Add note',
      logEdit: 'Edit this note',
      removeLog: 'Remove this note',
      moreLogs: '{count} more notes',
      logLatest: 'latest',
      ageDays: '{days}d old',
      ageToday: 'created today',
      ageTitle: 'Created on {day}',
      editorEdit: 'Edit entry',
      editorCreate: 'New sub-entry',
      entryCreate: 'New entry',
      editorUnder: 'Under “{text}”',
      editorRemove: 'Delete this entry',
      summaryTitle: 'Daily summary',
      summaryAuto: 'Generated automatically; edit it and save',
      summarySave: 'Save summary',
      summarySaved: 'Saved',
      summaryCopy: 'Copy',
      summaryCopied: 'Copied',
      summaryReset: 'Back to automatic',
      summaryAgent: 'Ask the agent to summarise',
      summaryAgentHint: 'Hand this day’s record to the agent in the conversation',
      summaryEmpty: 'Nothing logged on this day yet.',
      summaryHead: '{day} · logged {planned} · completed {done} · still open {open}',
      summaryDoneHeading: 'Completed',
      summaryOpenHeading: 'Still open',
      summaryTagsHeading: 'Tags',
      weekTitle: 'Last 7 days',
      weekLegendPlanned: 'logged',
      weekLegendDone: 'done',
      tagsTitle: 'Tags',
      tagAuto: 'The colour rotates through the palette automatically',
      agentPromptHead: 'Please summarise my work on {day} and point out what is still open.',
      agentPromptPlanned: 'Logged that day:',
      agentPromptDone: 'Completed that day:',
      agentPromptOpen: 'Still open:',
      locationTitle: 'Data location',
      locationHint: 'Data is written as an incremental journal plus periodic snapshots, so a save only appends what changed.',
      locationCurrent: 'Current directory: {directory}',
      locationChange: 'Change…',
      locationPick: 'Pick a folder',
      locationReset: 'Use the default',
      locationInvalid: 'Enter an absolute path, for example D:\\notes\\todo',
      locationMoved: 'Moved {count} data file(s) to the new directory',
      locationSkipped: 'The target already had files with these names; nothing was overwritten: {names}',
      locationDefault: 'Default location',
      locationJournal: 'Journal lines waiting to be folded: {count}',
      dayHint: 'Only entries added or completed on {day} are shown, with their parents.',
      counts: '{active} open · {done} done',
      sectionActive: 'Open',
      sectionDone: 'Done',
      emptyActive: 'Nothing open here yet.',
      emptyDone: 'Nothing completed here yet.',
      loading: 'Reading the local data file…',
      storageFile: 'Data file: {path}',
      storageHistory: 'Activity log: {path}',
      storageBrowser: 'The data file on this machine is unreachable ({error}); changes stay in this browser only.',
      storageCorrupt: 'The data file cannot be parsed right now; the page opened empty and the file on disk was left untouched.',
      storageSqlite: 'SQLite database',
      storageJson: 'JSON snapshot (fallback)',
      storageSqliteHint: 'Row-level incremental writes, indexed by day: {path}',
      storageSqliteHintDb: 'Row-level incremental writes, indexed by day: {path}',
      storageFallbackHint: 'The database is unavailable, so JSON storage took over: {note}',
      storageMigrated: 'Imported {count} entries from JSON; originals kept as .imported-bak',
      saved: 'Saved',
      saving: 'Saving…',
      saveFailed: 'Save failed: {error}',
      placeholderNew: 'Write a to-do or a quick note, then press Enter',
      placeholderChild: 'Write a sub-entry, then press Enter',
      placeholderEdit: 'Edit this entry',
      add: 'Add',
      save: 'Save',
      cancel: 'Cancel',
      countToday: 'Count as completed today',
      addChild: 'Add sub-entry',
      edit: 'Edit',
      delete: 'Delete',
      confirm: 'Delete',
      confirmDelete: 'Delete this entry?',
      confirmDeleteWithChildren: 'Delete this entry and its {count} sub-entries?',
      expand: 'Expand sub-entries',
      collapse: 'Collapse sub-entries',
      childCount: '{count} sub-entries',
      markDone: 'Mark as completed',
      markActive: 'Mark as open',
      tagsLabel: 'Tags',
      tagPlaceholder: 'New tag, press Enter',
      tagSuggest: 'Existing tags — click one to add',
      tagAll: 'All tags',
      tagFilterLabel: 'Filter by tag',
      tagHint: 'Only entries carrying the “{tag}” tag are shown.',
      tagRename: 'Rename',
      tagRenameHint: 'Rename “{name}” to',
      tagRenameSave: 'Save',
      tagAutoHint: 'Colour is assigned automatically from the palette, so the wall stays readable.',
      searchLabel: 'Search the entries',
      searchPlaceholder: 'Search entries, notes, links or tags…',
      searchHint: 'Looks in an entry’s text, notes, links and tags, ignoring case; press Esc to clear.',
      searchClear: 'Clear the search',
      searchHide: 'Hide the search field',
      searchFound: '{count} found · “{query}”',
      searchEmpty: 'No entry matches “{query}”.',
      refLabel: 'Session',
      refOpen: 'Open this Session',
      refRemove: 'Remove the link to this Session',
      linkTitle: 'File as a to-do',
      linkHint: 'File what is in the composer as a to-do and link this Session',
      linkHeading: 'File as a to-do',
      linkTarget: 'Save to',
      linkNew: 'Create a new to-do',
      linkExisting: 'Link to an existing entry',
      linkDone: 'Count as completed today',
      linkClear: 'Clear the composer after saving',
      linkSave: 'Save',
      linkCancel: 'Cancel',
      linkDraftEmpty: 'Write something first, or pick an existing entry.',
      linkMissing: 'That entry no longer exists.',
      linkResultCreated: 'Created “{text}”',
      linkResultLinked: 'Linked to “{text}”',
      linkOpenPage: 'Open the to-do page',
      linkClose: 'Got it',
      linkNoSession: 'This Session cannot be read, so only the entry is saved.',
    };

    const CSS = `
.dtn-page {
  position: relative;
  --dtn-radius: 12px;
  --dtn-radius-lg: 16px;
  --dtn-line: 0.5px solid var(--dsw-alias-border-l2);
  --dtn-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.05);
  --dtn-shadow-2: 0 14px 36px rgba(0, 0, 0, 0.14), 0 4px 12px rgba(0, 0, 0, 0.07);
  --dtn-accent: var(--dsw-alias-brand-primary);
  --dtn-inner: 1240px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}

/* ================================================================== head == */

.dtn-head {
  flex: none;
  position: relative;
  box-sizing: border-box;
  padding: 22px 32px 16px;
  border-bottom: var(--dtn-line);
  background: var(--dsw-alias-bg-base);
}
/* Brand hairline: the one piece of chrome that carries the accent colour. */
.dtn-head::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.5px;
  height: 2px;
  background: linear-gradient(
    90deg,
    var(--dtn-accent) 0,
    var(--dtn-accent) 120px,
    transparent 280px,
    transparent 100%
  );
  opacity: 0.9;
}
html[data-platform='darwin'] .dtn-head {
  padding-top: calc(22px + var(--dsh-frame-top-clearance, 0px));
}
.dtn-head-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px 18px;
  width: 100%;
  max-width: var(--dtn-inner);
  margin: 0 auto;
}
.dtn-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 30px;
  letter-spacing: 0.2px;
}
.dtn-today {
  font-size: 13px;
  color: var(--dsw-alias-label-secondary);
  font-variant-numeric: tabular-nums;
}
.dtn-digest {
  font-size: 13px;
  color: var(--dsw-alias-label-caption);
  font-variant-numeric: tabular-nums;
}
.dtn-head-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.dtn-status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  width: 100%;
  max-width: var(--dtn-inner);
  margin: 12px auto 0;
  min-height: 22px;
}
.dtn-status { font-size: 13px; color: var(--dsw-alias-label-caption); overflow-wrap: anywhere; }
.dtn-status.is-warn { color: var(--dsw-alias-state-warn-primary); }
.dtn-status.is-error { color: var(--dsw-alias-state-error-primary); }
.dtn-status-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.dtn-loc-panel {
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: var(--dtn-inner);
  margin: 14px auto 0;
  padding: 16px 18px;
  border: var(--dtn-line);
  border-radius: var(--dtn-radius-lg);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
  box-shadow: var(--dtn-shadow-1);
}
.dtn-loc-panel .dtn-field { flex: 1 1 260px; }

/* ================================================================== tabs == */

.dtn-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  max-width: var(--dtn-inner);
  margin: 0 auto;
  padding: 14px 0 0;
  border-bottom: var(--dtn-line);
}
.dtn-tab {
  appearance: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  box-sizing: border-box;
  padding: 10px 18px 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: var(--dsw-alias-label-tertiary);
  background: transparent;
  border: 0;
  border-radius: 10px 10px 0 0;
}
.dtn-tab:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-hover); }
.dtn-tab.is-on { color: var(--dsw-alias-label-primary); }
.dtn-tab.is-on::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -0.5px;
  height: 2.5px;
  border-radius: 3px 3px 0 0;
  background: var(--dtn-accent);
}
.dtn-tab-count {
  min-width: 24px;
  padding: 0 8px;
  border-radius: 999px;
  text-align: center;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-tertiary);
  background: var(--dsw-alias-interactive-bg-active);
}
.dtn-tab.is-on .dtn-tab-count { color: var(--dsw-alias-label-secondary); }
.dtn-tabs-spacer { flex: 1 1 auto; }

/* ================================================================== body == */

.dtn-body {
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: var(--dtn-inner);
  margin: 0 auto;
  padding: 0 32px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.dtn-pane { display: flex; flex-direction: column; gap: 18px; padding: 24px 0 36px; }

/* ---------------------------------------------------------------- groups -- */

.dtn-group { display: flex; flex-direction: column; gap: 12px; }
.dtn-group-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 12px 2px 8px;
  border-bottom: var(--dtn-line);
  background: var(--dsw-alias-bg-base);
}
.dtn-group-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--dsw-alias-label-secondary);
  font-variant-numeric: tabular-nums;
}
.dtn-group-count { font-size: 12px; color: var(--dsw-alias-label-caption); font-variant-numeric: tabular-nums; }
.dtn-list { display: flex; flex-direction: column; gap: 10px; }
.dtn-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin: 32px 0;
  padding: 48px 20px;
  font-size: 14px;
  color: var(--dsw-alias-label-caption);
  text-align: center;
  border: 1px dashed var(--dsw-alias-border-l3);
  border-radius: var(--dtn-radius-lg);
}
.dtn-empty-glyph { color: var(--dsw-alias-label-caption); opacity: 0.65; }

/* ----------------------------------------------------------------- notes --- */

/* A compact list of bordered cards, one entry per row. The entry's own colour
   is the left edge; the paper wash and the tilt of the sticky wall are gone. */
.dtn-masonry {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dtn-note {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 12px 16px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-left: 3px solid var(--dtn-note-accent);
  border-radius: 10px;
  background: var(--dsw-alias-card-fill);
  transition: border-color 0.14s ease, box-shadow 0.14s ease;
}
.dtn-note:hover {
  border-color: var(--dsw-alias-border-l3);
  box-shadow: var(--dtn-shadow-1);
}
.dtn-note.is-done { opacity: 0.7; }
.dtn-note.is-done .dtn-note-text { color: var(--dsw-alias-label-tertiary); text-decoration: line-through; }
.dtn-note.is-overdue { border-left-color: var(--dsw-alias-state-warn-primary); }
.dtn-note.is-editing { border-color: var(--dtn-accent); }
/* A sub-note sits inside its parent's card, a little tighter. */
.dtn-note.is-child {
  margin: 0;
  padding: 10px 12px;
  border-left-width: 2px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
}
.dtn-note-head { display: flex; align-items: flex-start; gap: 10px; }
.dtn-note-text {
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
  line-height: 21px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.dtn-note-textlink {
  color: var(--dsw-alias-link);
  text-decoration: none;
  overflow-wrap: anywhere;
}
.dtn-note-textlink:hover { text-decoration: underline; }
.dtn-note-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.14s ease;
}
.dtn-note:hover .dtn-note-actions,
.dtn-note:focus-within .dtn-note-actions { opacity: 1; }
.dtn-note-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
/* Progress: accent while unfinished, success at 100%. */
.dtn-note-progress {
  display: block;
  width: 100%;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--dsw-alias-interactive-bg-active);
}
.dtn-note-progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--dtn-accent);
  transition: width 0.2s ease;
}
.dtn-note-progress-fill.is-done { background: var(--dsw-alias-state-success-primary); }
.dtn-note-pct {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.dtn-note-pct.is-open { color: var(--dtn-accent); }
.dtn-note-pct.is-done { color: var(--dsw-alias-state-success-primary); }
.dtn-range {
  flex: 1 1 180px;
  min-width: 140px;
  height: 20px;
  margin: 0;
  accent-color: var(--dtn-accent);
  cursor: pointer;
}
.dtn-note-note {
  appearance: none;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 12.5px;
  line-height: 18px;
  color: var(--dsw-alias-label-caption);
  cursor: default;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
button.dtn-note-note { cursor: pointer; }
button.dtn-note-note:hover { color: var(--dsw-alias-label-primary); }
.dtn-note-note.is-warn { color: var(--dsw-alias-state-warn-primary); }
.dtn-note-caret {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 12.5px;
  color: var(--dsw-alias-label-caption);
  cursor: pointer;
}
.dtn-note-caret:hover { color: var(--dsw-alias-label-primary); }
.dtn-note-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.dtn-note-kids {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 2px;
  padding-left: 12px;
  border-left: 1.5px solid var(--dsw-alias-border-l3);
}
/* Links and the progress trail carried by a note. */
.dtn-note-link {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 1px 8px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  background: var(--dsw-alias-interactive-bg-hover);
  font-size: 12px;
  line-height: 20px;
}
a.dtn-note-link {
  color: var(--dsw-alias-link);
  text-decoration: none;
}
a.dtn-note-link:hover { text-decoration: underline; }
.dtn-note-link-open {
  max-width: 240px;
  padding: 1px 8px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-link);
  text-decoration: none;
}
.dtn-note-link-open:hover { text-decoration: underline; }
/* The progress trail: a compact timeline at the foot of the card. No box —
   just a hairline above it, a time column, and one rail through the entries. */
.dtn-trail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
  padding-top: 8px;
  border-top: 0.5px solid var(--dsw-alias-border-l1);
}
.dtn-trail-head { display: flex; align-items: center; gap: 6px; }
.dtn-trail-label {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: color-mix(in srgb, var(--dtn-note-accent) 62%, var(--dsw-alias-label-caption));
}
.dtn-trail-count {
  font-size: 10.5px;
  line-height: 14px;
  padding: 0 5px;
  border-radius: 999px;
  color: var(--dsw-alias-label-caption);
  background: var(--dsw-alias-interactive-bg-hover);
  font-variant-numeric: tabular-nums;
}
.dtn-trail-add {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  padding: 0;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  color: var(--dsw-alias-label-caption);
  background: transparent;
  border: 0;
  border-radius: 5px;
}
.dtn-trail-add:hover { color: var(--dtn-label-primary, var(--dsw-alias-label-primary)); background: var(--dsw-alias-interactive-bg-hover); }
.dtn-trail-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
/* Time column, then the rail with the note beside it. */
.dtn-trail-item {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  column-gap: 8px;
  align-items: start;
}
.dtn-trail-time {
  padding-top: 2px;
  font-size: 10.5px;
  line-height: 14px;
  text-align: right;
  color: var(--dsw-alias-label-caption);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.dtn-trail-body { position: relative; min-width: 0; padding: 0 0 7px 13px; }
.dtn-trail-item:last-child .dtn-trail-body { padding-bottom: 0; }
/* The rail runs from this entry's dot down to the next one. */
.dtn-trail-body::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 10px;
  bottom: -1px;
  width: 1.5px;
  border-radius: 1px;
  background: color-mix(in srgb, var(--dtn-note-accent) 24%, transparent);
}
.dtn-trail-item:last-child .dtn-trail-body::before { display: none; }
.dtn-trail-dot {
  position: absolute;
  left: 0;
  top: 4px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid color-mix(in srgb, var(--dtn-note-accent) 45%, transparent);
  background: transparent;
}
.dtn-trail-item.is-latest .dtn-trail-dot {
  border-color: var(--dtn-note-accent);
  background: var(--dtn-note-accent);
}
.dtn-trail-text {
  display: block;
  font-size: 12.5px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
  overflow-wrap: anywhere;
  /* Notes are paragraphs: keep the author's line breaks. */
  white-space: pre-wrap;
}
.dtn-trail-item.is-latest .dtn-trail-text { color: var(--dsw-alias-label-primary); }
.dtn-trail-more {
  appearance: none;
  align-self: flex-start;
  padding: 0 6px;
  font: inherit;
  font-size: 11.5px;
  line-height: 18px;
  cursor: pointer;
  color: var(--dsw-alias-label-caption);
  background: transparent;
  border: 0;
  border-radius: 5px;
}
.dtn-trail-more:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-hover); }
.dtn-note-quick {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-interactive-bg-hover);
  border: 0;
  border-radius: 6px;
}
.dtn-note-quick:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-active); }
.dtn-note-quick.is-on,
.dtn-trail-add.is-on {
  color: var(--dsw-alias-label-on-color);
  background: var(--dtn-accent);
}

/* A small status pill, for facts that are worth stating but not shouting. */
.dtn-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  box-sizing: border-box;
  padding: 2px 9px;
  font-size: 11.5px;
  line-height: 18px;
  border: 0.5px solid transparent;
  border-radius: 999px;
  white-space: nowrap;
}
.dtn-badge.is-ok {
  color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 78%, var(--dsw-alias-label-primary));
  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 28%, transparent);
}
.dtn-badge.is-warn {
  color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 80%, var(--dsw-alias-label-primary));
  background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 13%, transparent);
  border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 30%, transparent);
}

/* ------------------------------------------- rewriting one progress note -- */

/* The inline box that rewrites a note, used by the card timeline and the entry
   editor alike, so a note looks the same wherever it is edited. */
.dtn-log-edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}
.dtn-log-edit-input {
  min-height: 48px;
  font-size: 12.5px;
  line-height: 18px;
}
.dtn-log-edit-actions { display: flex; align-items: center; gap: 6px; }
.dtn-log-edit-actions .dtn-btn { min-width: 56px; font-size: 12px; }

/* The ✎ that opens it: quiet until the row is hovered or focused. */
.dtn-log-edit-open {
  appearance: none;
  position: absolute;
  right: 0;
  top: 1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  padding: 0;
  font: inherit;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  color: var(--dsw-alias-label-caption);
  background: var(--dsw-alias-bg-base);
  border: 0;
  border-radius: 5px;
}
.dtn-trail-item:hover .dtn-log-edit-open,
.dtn-trail-item:focus-within .dtn-log-edit-open,
.dtn-log-edit-open:focus { opacity: 1; }
.dtn-log-edit-open:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-active); }
/* The note text yields room for the ✎ rather than running underneath it. */
.dtn-trail-item:hover .dtn-trail-text,
.dtn-trail-item:focus-within .dtn-trail-text { padding-right: 22px; }

/* ----------------------------------------------------------------- inline --- */

/* The little form a card grows for one note or one link: a row at the bottom
   of the card, so adding one never opens the whole editor. */
.dtn-inline-add {
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  width: 100%;
  margin-top: 4px;
  padding: 10px;
  border: 0.5px dashed color-mix(in srgb, var(--dtn-note-accent) 45%, var(--dsw-alias-border-l2));
  border-radius: var(--dtn-radius);
  background: color-mix(in srgb, var(--dtn-note-accent) 5%, transparent);
}
.dtn-inline-input {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 11px;
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  resize: vertical;
}
.dtn-inline-input:focus {
  outline: none;
  border-color: var(--dtn-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dtn-accent) 20%, transparent);
}
.dtn-inline-input::placeholder { color: var(--dsw-alias-label-caption); }
.dtn-inline-actions { display: flex; align-items: center; gap: 8px; }
.dtn-inline-actions .dtn-btn { min-width: 68px; }

/* --------------------------------------------------------------- editor --- */

/* The one editor surface: full width, under the day header of its entry, so
   nothing is ever edited inside a masonry column. */
.dtn-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin: 0 0 14px;
  padding: 16px 18px;
  border: 1px solid var(--dtn-accent);
  border-radius: var(--dtn-radius-lg);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
  box-shadow: var(--dtn-shadow-2);
}
.dtn-panel-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.dtn-panel-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.dtn-panel-text {
  box-sizing: border-box;
  width: 100%;
  min-height: 68px;
  padding: 12px 14px;
  font: inherit;
  font-size: 15px;
  line-height: 23px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-specific-input-major);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dtn-radius);
  resize: vertical;
}
.dtn-panel-text:focus { outline: none; border-color: var(--dtn-accent); }
.dtn-panel-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
  border-top: 0.5px solid var(--dsw-alias-border-l2);
}
.dtn-panel-trail { display: flex; flex-direction: column; gap: 8px; }
.dtn-panel-trail .dtn-note-log {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-card-fill);
}
.dtn-panel-trail .dtn-note-log-text {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 20px;
  color: var(--dsw-alias-label-primary);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
/* The note box in the editor: room for a few lines, grows if dragged. */
.dtn-log-input { min-height: 68px; }

/* --------------------------------------------------------------- calendar --- */

.dtn-cal-head { display: flex; align-items: center; gap: 10px; }
.dtn-cal-month { font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; }
.dtn-cal-week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
  padding: 0 2px;
  font-size: 12px;
  color: var(--dsw-alias-label-caption);
  text-align: center;
}
.dtn-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}
.dtn-cal-cell {
  appearance: none;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 106px;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-card-fill);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  transition: border-color 0.14s ease, background 0.14s ease;
}
.dtn-cal-cell:hover {
  border-color: var(--dsw-alias-border-l4);
  background: var(--dsw-alias-card-fill-hover, var(--dsw-alias-card-fill));
}
/* The hover hint that says this whole cell is the way to add to that day. */
.dtn-cal-add {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 13px;
  line-height: 1;
  color: var(--dtn-accent);
  opacity: 0;
  transition: opacity 0.14s ease;
}
.dtn-cal-cell:hover .dtn-cal-add,
.dtn-cal-cell.is-on .dtn-cal-add { opacity: 1; }
.dtn-cal-cell.is-out { opacity: 0.45; }
.dtn-cal-cell.is-today { border-color: var(--dtn-accent); }
.dtn-cal-cell.is-on { box-shadow: inset 0 0 0 2px var(--dtn-accent); }
.dtn-cal-daynum { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
.dtn-cal-cell.is-today .dtn-cal-daynum { color: var(--dtn-accent); }
.dtn-cal-marks {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: var(--dsw-alias-label-caption);
  font-variant-numeric: tabular-nums;
}
.dtn-cal-count { white-space: nowrap; }
.dtn-cal-count.is-done { color: var(--dsw-alias-state-success-primary); }
.dtn-cal-rows { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
/* Each cell row wears its entry's own colour, the same one the card carries. */
.dtn-cal-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 1px 6px 1px 5px;
  border-left: 2px solid var(--dtn-row-color);
  border-radius: 5px;
  background: color-mix(in srgb, var(--dtn-row-color) 14%, transparent);
}
.dtn-cal-row.is-done { opacity: 0.6; }
.dtn-cal-row.is-done .dtn-cal-text { text-decoration: line-through; }
.dtn-cal-text {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* Mixed with the label colour so every palette entry stays readable on its
     own wash, light and dark alike. */
  color: color-mix(in srgb, var(--dtn-row-color) 78%, var(--dsw-alias-label-primary));
}
.dtn-cal-more { font-size: 11px; color: var(--dsw-alias-label-caption); }
.dtn-empty-text { margin: 0; font-size: 13px; color: var(--dsw-alias-label-caption); }

/* ----------------------------------------------------------------- themes --- */

/*
 * A page theme is a handful of core colours plus a decoration flag. The cores
 * are mapped onto the host tokens this page consumes, scoped to the page root,
 * so a theme changes this page only. Cores are the same values the eye-care skin
 * bundle ships (audited there for text/surface contrast), so a themed page keeps
 * the legibility budget: primary text >= 7:1 on its own background.
 */
.dtn-page[data-scheme='light'].t-paper { --dtn-bg:#f7f1e3; --dtn-surface:#fffaf0; --dtn-alt:#f1e9d8; --dtn-code:#fbf4e6; --dtn-text:#3b322a; --dtn-dim:#6b5c4d; --dtn-faint:#7a6a58; --dtn-accent:#8a5a20; --dtn-green:#4f6b2a; --dtn-warn:#85650f; --dtn-red:#a83a2c; }
.dtn-page[data-scheme='dark'].t-paper { --dtn-bg:#1f1b17; --dtn-surface:#292420; --dtn-alt:#332d27; --dtn-code:#241f1b; --dtn-text:#e8dfd0; --dtn-dim:#c3b6a2; --dtn-faint:#a5977f; --dtn-accent:#d8a860; --dtn-green:#9dbf6a; --dtn-warn:#e0c05a; --dtn-red:#e58a7a; }
.dtn-page[data-scheme='light'].t-celadon { --dtn-bg:#f0f4ef; --dtn-surface:#ffffff; --dtn-alt:#edf2ec; --dtn-code:#f4f8f3; --dtn-text:#2f3a33; --dtn-dim:#55635a; --dtn-faint:#64736a; --dtn-accent:#357560; --dtn-green:#3f7a45; --dtn-warn:#7d6a1c; --dtn-red:#ad4238; }
.dtn-page[data-scheme='dark'].t-celadon { --dtn-bg:#101714; --dtn-surface:#18211d; --dtn-alt:#202b26; --dtn-code:#141c18; --dtn-text:#d8e4dc; --dtn-dim:#a9bab0; --dtn-faint:#8b9c92; --dtn-accent:#6fc0a8; --dtn-green:#8ac089; --dtn-warn:#cfba6a; --dtn-red:#e08a80; }
.dtn-page[data-scheme='light'].t-mist { --dtn-bg:#f2f4f7; --dtn-surface:#ffffff; --dtn-alt:#eef1f5; --dtn-code:#f6f8fa; --dtn-text:#303740; --dtn-dim:#545e6b; --dtn-faint:#68727f; --dtn-accent:#39678f; --dtn-green:#407a4c; --dtn-warn:#7d6a1e; --dtn-red:#ab4444; }
.dtn-page[data-scheme='dark'].t-mist { --dtn-bg:#16181c; --dtn-surface:#1e2126; --dtn-alt:#262a31; --dtn-code:#1a1d21; --dtn-text:#dfe3e9; --dtn-dim:#b0b8c3; --dtn-faint:#939ca8; --dtn-accent:#7fb2e0; --dtn-green:#8fc08f; --dtn-warn:#d3bd6e; --dtn-red:#e08e8e; }
.dtn-page[data-scheme='light'].t-contrast { --dtn-bg:#ffffff; --dtn-surface:#ffffff; --dtn-alt:#f2f3f5; --dtn-code:#f7f8f9; --dtn-text:#101215; --dtn-dim:#3c434d; --dtn-faint:#5a626d; --dtn-accent:#0b4f8a; --dtn-green:#116329; --dtn-warn:#7a4f00; --dtn-red:#96201a; }
.dtn-page[data-scheme='dark'].t-contrast { --dtn-bg:#08090b; --dtn-surface:#131519; --dtn-alt:#1c1f25; --dtn-code:#101216; --dtn-text:#f7f8fa; --dtn-dim:#c8ced8; --dtn-faint:#a3abb7; --dtn-accent:#7fc0ff; --dtn-green:#7fe09a; --dtn-warn:#ffd166; --dtn-red:#ff9a92; }
/* The tech theme keeps the app's own colours and adds decoration only. */
.dtn-page[data-scheme='light'].t-tech { --dtn-bg:#f7f9fb; --dtn-surface:#ffffff; --dtn-alt:#eef3f8; --dtn-code:#f3f7fb; --dtn-text:#1d2733; --dtn-dim:#4b5a6b; --dtn-faint:#667684; --dtn-accent:#1f6feb; --dtn-green:#1a7f4b; --dtn-warn:#8a6100; --dtn-red:#b4232a; }
.dtn-page[data-scheme='dark'].t-tech { --dtn-bg:#0e1116; --dtn-surface:#161b23; --dtn-alt:#1d242e; --dtn-code:#131820; --dtn-text:#e4ecf5; --dtn-dim:#a8b6c6; --dtn-faint:#8794a3; --dtn-accent:#5aa9ff; --dtn-green:#4fd08a; --dtn-warn:#e8c168; --dtn-red:#ff8a86; }

/* The core set becomes the host tokens this page reads. */
.dtn-page.t-paper, .dtn-page.t-celadon, .dtn-page.t-mist,
.dtn-page.t-contrast, .dtn-page.t-tech {
  --dsw-alias-bg-base: var(--dtn-bg);
  --dsw-alias-bg-layer-1: var(--dtn-surface);
  --dsw-alias-bg-layer-2: var(--dtn-alt);
  --dsw-alias-bg-layer-3: var(--dtn-alt);
  --dsw-alias-card-fill: var(--dtn-surface);
  --dsw-alias-card-fill-hover: var(--dtn-alt);
  --dsw-alias-card-tile-fill: color-mix(in srgb, var(--dtn-text) 4%, transparent);
  --dsw-specific-input-major: var(--dtn-code);
  --dsw-alias-label-primary: var(--dtn-text);
  --dsw-alias-label-secondary: var(--dtn-dim);
  --dsw-alias-label-tertiary: var(--dtn-faint);
  --dsw-alias-label-caption: color-mix(in srgb, var(--dtn-faint) 88%, var(--dtn-bg));
  --dsw-alias-border-l1: color-mix(in srgb, var(--dtn-text) 7%, transparent);
  --dsw-alias-border-l2: color-mix(in srgb, var(--dtn-text) 13%, transparent);
  --dsw-alias-border-l3: color-mix(in srgb, var(--dtn-text) 19%, transparent);
  --dsw-alias-border-l4: color-mix(in srgb, var(--dtn-text) 26%, transparent);
  --dsw-alias-interactive-bg-hover: color-mix(in srgb, var(--dtn-text) 6%, transparent);
  --dsw-alias-interactive-bg-active: color-mix(in srgb, var(--dtn-text) 12%, transparent);
  --dsw-alias-fill-tsp-secondary: color-mix(in srgb, var(--dtn-text) 8%, transparent);
  --dsw-alias-link: var(--dtn-accent);
  --dsw-alias-state-success-primary: var(--dtn-green);
  --dsw-alias-state-warn-primary: var(--dtn-warn);
  --dsw-alias-state-error-primary: var(--dtn-red);
}

/*
 * Decoration layer: only the tech theme paints it. A faint engineering grid,
 * the accent colour used as a light source (never as the only signal), and
 * monospace figures.
 */

/* ----------------------------------------------------------- theme chips --- */

.dtn-themes { display: flex; flex-wrap: wrap; gap: 8px; }
.dtn-theme-chip {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  padding: 6px 12px 6px 8px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-interactive-bg-hover);
  border: 1px solid transparent;
  border-radius: 999px;
}
.dtn-theme-chip:hover { color: var(--dsw-alias-label-primary); }
.dtn-theme-chip.is-on {
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
  background: var(--dsw-alias-card-fill);
  border-color: var(--dtn-accent);
}
.dtn-theme-swatch {
  display: inline-flex;
  width: 26px;
  height: 16px;
  overflow: hidden;
  border: 0.5px solid var(--dsw-alias-border-l3);
  border-radius: 5px;
}
.dtn-theme-half { width: 50%; height: 100%; }
/* Each swatch paints that theme's own light and dark core, so the row is a
   preview of the choice rather than six identical dots. */
.dtn-theme-swatch.t-paper .sw-a { background: #f7f1e3; }
.dtn-theme-swatch.t-paper .sw-b { background: #292420; }
.dtn-theme-swatch.t-celadon .sw-a { background: #f0f4ef; }
.dtn-theme-swatch.t-celadon .sw-b { background: #18211d; }
.dtn-theme-swatch.t-mist .sw-a { background: #f2f4f7; }
.dtn-theme-swatch.t-mist .sw-b { background: #1e2126; }
.dtn-theme-swatch.t-contrast .sw-a { background: #ffffff; }
.dtn-theme-swatch.t-contrast .sw-b { background: #08090b; }
.dtn-theme-swatch.t-tech .sw-a { background: #eef3f8; }
.dtn-theme-swatch.t-tech .sw-b { background: #0e1116; }
.dtn-theme-swatch.t-plain .sw-a { background: var(--dsw-alias-bg-base); }
.dtn-theme-swatch.t-plain .sw-b { background: var(--dsw-alias-label-caption); }

/*
 * The tech look is one class on the page root: a faint engineering grid, the
 * accent colour used as a light source (glow never carries meaning that colour
 * alone would), and monospace figures. Every value is mixed from host tokens,
 * so it follows light/dark and any skin. Switch it off in 概览.
 */
.dtn-page.t-tech {
  --dtn-grid-line: color-mix(in srgb, var(--dtn-text, var(--dsw-alias-label-primary)) 5%, transparent);
  --dtn-glow-soft: 0 0 16px color-mix(in srgb, var(--dtn-accent) 20%, transparent);
  --dtn-glow-strong: 0 0 0 1px color-mix(in srgb, var(--dtn-accent) 55%, transparent),
    0 0 20px color-mix(in srgb, var(--dtn-accent) 26%, transparent);
  --dtn-mono: ui-monospace, "Cascadia Mono", "Maple Mono NF CN", "SFMono-Regular", monospace;
  background-image:
    linear-gradient(var(--dtn-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--dtn-grid-line) 1px, transparent 1px);
  background-size: 34px 34px, 34px 34px;
  background-position: -1px -1px, -1px -1px;
}
.dtn-page.t-tech .dtn-head,
.dtn-page.t-tech .dtn-composer {
  background-color: var(--dsw-alias-bg-base);
  backdrop-filter: blur(2px);
}
.dtn-page.t-tech .dtn-head::after {
  height: 2px;
  box-shadow: 0 0 14px color-mix(in srgb, var(--dtn-accent) 55%, transparent);
}
.dtn-page.t-tech .dtn-title { letter-spacing: 0.6px; }
.dtn-page.t-tech .dtn-tab.is-on::after {
  box-shadow: 0 0 12px color-mix(in srgb, var(--dtn-accent) 70%, transparent);
}
.dtn-page.t-tech .dtn-digest,
.dtn-page.t-tech .dtn-tile-num,
.dtn-page.t-tech .dtn-note-note,
.dtn-page.t-tech .dtn-cal-daynum,
.dtn-page.t-tech .dtn-cal-count,
.dtn-page.t-tech .dtn-tab-count,
.dtn-page.t-tech .dtn-group-count {
  font-family: var(--dtn-mono);
}
.dtn-page.t-tech .dtn-tile-num { text-shadow: 0 0 18px color-mix(in srgb, currentColor 35%, transparent); }
.dtn-page.t-tech .dtn-tile.is-rate .dtn-tile-num,
.dtn-page.t-tech .dtn-tile.is-open .dtn-tile-num {
  text-shadow: 0 0 20px color-mix(in srgb, currentColor 45%, transparent);
}
.dtn-page.t-tech .dtn-bar-done {
  box-shadow: 0 0 12px color-mix(in srgb, var(--dtn-accent) 45%, transparent);
}
.dtn-page.t-tech .dtn-progress-fill {
  box-shadow: 0 0 12px color-mix(in srgb, var(--dtn-accent) 40%, transparent);
}
.dtn-page.t-tech .dtn-group-head {
  border-bottom-color: color-mix(in srgb, var(--dtn-accent) 34%, var(--dsw-alias-border-l2));
}
.dtn-page.t-tech .dtn-note {
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 2%, var(--dsw-alias-card-fill));
  overflow: hidden;
}
.dtn-page.t-tech .dtn-note:hover {
  border-color: color-mix(in srgb, var(--dtn-accent) 55%, var(--dsw-alias-border-l2));
  box-shadow: var(--dtn-glow-soft);
}
/* A HUD corner bracket, revealed on hover. */
.dtn-page.t-tech .dtn-note::after {
  content: '';
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 11px;
  height: 11px;
  border-right: 1.5px solid color-mix(in srgb, var(--dtn-note-accent) 65%, transparent);
  border-bottom: 1.5px solid color-mix(in srgb, var(--dtn-note-accent) 65%, transparent);
  border-radius: 0 0 5px 0;
  opacity: 0;
  transition: opacity 0.14s ease;
}
.dtn-page.t-tech .dtn-note:hover::after { opacity: 1; }
.dtn-page.t-tech .dtn-btn.is-primary { box-shadow: var(--dtn-glow-soft); }
.dtn-page.t-tech .dtn-composer-inner:focus-within { box-shadow: var(--dtn-glow-strong); }
.dtn-page.t-tech .dtn-dot { box-shadow: 0 0 12px color-mix(in srgb, var(--dtn-draft, var(--dtn-accent)) 60%, transparent); }
.dtn-page.t-tech .dtn-cal-cell.is-today { box-shadow: var(--dtn-glow-soft); }
.dtn-page.t-tech .dtn-cal-cell.is-on {
  box-shadow: inset 0 0 0 2px var(--dtn-accent), var(--dtn-glow-soft);
}
.dtn-page.t-tech .dtn-cal-cell:hover {
  border-color: color-mix(in srgb, var(--dtn-accent) 45%, var(--dsw-alias-border-l2));
}
.dtn-page.t-tech .dtn-panel { box-shadow: var(--dtn-glow-soft), var(--dtn-shadow-2); }
.dtn-page.t-tech .dtn-trail-item.is-latest .dtn-trail-dot {
  box-shadow: 0 0 8px color-mix(in srgb, var(--dtn-note-accent) 55%, transparent);
}
.dtn-page.t-tech .dtn-card {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--dtn-accent) 4%, transparent), transparent 40%),
    var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
}
@media (max-width: 780px) {
  .dtn-cal-cell { min-height: 78px; padding: 6px 8px; }
  .dtn-cal-rows { display: none; }
}

/* --------------------------------------------------------------- controls -- */

.dtn-check {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  padding: 0;
  cursor: pointer;
  color: transparent;
  background: transparent;
  border: 1.5px solid var(--dsw-alias-border-l4);
  border-radius: 7px;
  transition: background 0.14s ease, border-color 0.14s ease;
}
.dtn-check:hover { border-color: var(--dtn-accent); }
.dtn-check.is-on {
  color: var(--dsw-alias-label-on-color);
  background: var(--dsw-alias-state-success-primary);
  border-color: var(--dsw-alias-state-success-primary);
}
.dtn-caret,
.dtn-icon-btn {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
}
.dtn-caret, .dtn-icon-btn { cursor: pointer; color: var(--dsw-alias-label-caption); }
.dtn-caret:hover, .dtn-icon-btn:hover {
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-interactive-bg-active);
}
.dtn-icon-btn.is-danger:hover { color: var(--dsw-alias-state-error-primary); }
.dtn-caret-spacer { flex: none; display: inline-block; width: 24px; height: 24px; }
.dtn-inline-panel {
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  font-size: 14px;
  color: var(--dsw-alias-label-secondary);
  border: var(--dtn-line);
  border-radius: var(--dtn-radius);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base));
}
.dtn-editor { display: flex; flex-direction: column; gap: 12px; }
.dtn-editor-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.dtn-field {
  flex: 1 1 220px;
  min-width: 160px;
  box-sizing: border-box;
  padding: 10px 14px;
  font: inherit;
  font-size: 14px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-specific-input-major);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dtn-radius);
  resize: vertical;
}
textarea.dtn-field { min-height: 64px; }
.dtn-field:focus { outline: none; border-color: var(--dtn-accent); }
.dtn-field::placeholder { color: var(--dsw-alias-label-caption); }
.dtn-check-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  user-select: none;
}
.dtn-cb { flex: none; width: 16px; height: 16px; margin: 0; accent-color: var(--dtn-accent); }
.dtn-btn {
  appearance: none;
  box-sizing: border-box;
  padding: 7px 16px;
  font: inherit;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  color: var(--dsw-alias-label-primary);
  background: transparent;
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 10px;
  transition: background 0.14s ease, border-color 0.14s ease;
}
.dtn-btn:hover { background: var(--dsw-alias-interactive-bg-hover); border-color: var(--dsw-alias-border-l4); }
.dtn-btn.is-primary {
  color: var(--dsw-alias-label-on-color);
  background: var(--dtn-accent);
  border-color: transparent;
}
.dtn-btn.is-primary:hover { background: var(--dsw-alias-button-primary-hover, var(--dtn-accent)); }
.dtn-btn.is-danger { color: var(--dsw-alias-state-error-primary); }
.dtn-btn.is-quiet { padding: 3px 10px; font-size: 12.5px; border-color: transparent; }
.dtn-btn.is-quiet:hover { border-color: var(--dsw-alias-border-l3); }
.dtn-btn:disabled { opacity: 0.5; cursor: default; }
.dtn-navbtn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 30px;
  height: 30px;
  padding: 0 10px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-interactive-bg-hover);
  border: 0;
  border-radius: 9px;
}
.dtn-navbtn:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-active); }
.dtn-date {
  box-sizing: border-box;
  height: 32px;
  padding: 0 10px;
  font: inherit;
  font-size: 13px;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-specific-input-major);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 9px;
}

/* ------------------------------------------------------------------ tags -- */

.dtn-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.dtn-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 4px 12px;
  overflow: hidden;
  font: inherit;
  font-size: 12px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-interactive-bg-hover);
  border: 0.5px solid transparent;
  border-radius: 8px;
  font-variant-numeric: tabular-nums;
}
button.dtn-tag { cursor: pointer; }
button.dtn-tag:hover { filter: brightness(0.95); }
.dtn-tag.is-on { font-weight: 600; }
.dtn-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  width: 100%;
  padding: 10px 0 4px;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: thin;
}

/* The lookup row: a content search, then the tag chips, stacked so the search
   keeps the full width while the chips scroll sideways on their own. */
.dtn-filterbar { display: flex; flex-direction: column; gap: 2px; width: 100%; }
.dtn-filterbar .dtn-filter { padding-top: 2px; }
/* The tag chips scroll; the magnifier stays put at the right end of the line. */
.dtn-filterline { display: flex; align-items: center; gap: 8px; width: 100%; }
.dtn-filterline .dtn-filter { flex: 1 1 auto; min-width: 0; }
.dtn-search-toggle {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 26px;
  height: 26px;
  margin-left: auto;
  padding: 0;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
}
.dtn-search-toggle:hover {
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-interactive-bg-hover);
  border-color: var(--dsw-alias-border-l2);
}
.dtn-search-toggle.is-on {
  color: var(--dtn-accent);
  background: var(--dsw-alias-interactive-bg-hover);
  border-color: color-mix(in srgb, var(--dtn-accent) 40%, transparent);
}
.dtn-search-toggle.is-on:hover { background: var(--dsw-alias-interactive-bg-active); }
.dtn-search { position: relative; display: flex; align-items: center; width: 100%; }
.dtn-search-input {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 34px 8px 34px;
  font: inherit;
  font-size: 13px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-specific-input-major);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
}
.dtn-search-input:focus {
  outline: none;
  border-color: var(--dtn-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dtn-accent) 18%, transparent);
}
.dtn-search-input::placeholder { color: var(--dsw-alias-label-caption); }
/* A drawn magnifier, so the field needs no icon dependency. */
.dtn-search::before {
  content: '';
  position: absolute;
  left: 13px;
  top: 50%;
  width: 9px;
  height: 9px;
  margin-top: -7px;
  pointer-events: none;
  border: 1.5px solid var(--dsw-alias-label-caption);
  border-radius: 50%;
}
.dtn-search::after {
  content: '';
  position: absolute;
  left: 21px;
  top: 50%;
  width: 5px;
  height: 1.5px;
  margin-top: 3px;
  pointer-events: none;
  transform: rotate(45deg);
  background: var(--dsw-alias-label-caption);
  border-radius: 1px;
}
.dtn-search-clear {
  appearance: none;
  position: absolute;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 22px;
  height: 22px;
  padding: 0;
  font: inherit;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-interactive-bg-hover);
  border: 0;
  border-radius: 7px;
}
.dtn-search-clear:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-active); }
.dtn-filter .dtn-tag { flex: none; }
.dtn-tag-input {
  flex: 1 1 140px;
  min-width: 120px;
  box-sizing: border-box;
  padding: 6px 14px;
  font: inherit;
  font-size: 13px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-specific-input-major);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
}
.dtn-tag-input:focus { outline: none; border-color: var(--dtn-accent); }
.dtn-tag-input::placeholder { color: var(--dsw-alias-label-caption); }
.dtn-tag-editor { display: inline-flex; align-items: center; gap: 8px; }
.dtn-tag-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; max-height: 168px; overflow-y: auto; }

/* --------------------------------------------------------------- session -- */

.dtn-refs { display: flex; flex-wrap: wrap; gap: 8px; }
.dtn-ref {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-interactive-bg-hover);
}
.dtn-ref-open,
.dtn-ref-drop {
  appearance: none;
  max-width: 260px;
  padding: 0 10px;
  overflow: hidden;
  font: inherit;
  font-size: 12px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
}
.dtn-ref-drop { padding: 0 6px; color: var(--dsw-alias-label-caption); }
.dtn-ref-open:hover, .dtn-ref-drop:hover { color: var(--dsw-alias-label-primary); }
.dtn-ref-open:disabled { cursor: default; color: var(--dsw-alias-label-secondary); }

/* =============================================================== overview == */

.dtn-overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
}
.dtn-tile {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px 19px;
  border: var(--dtn-line);
  border-radius: var(--dtn-radius-lg);
  /* Every tile carries a 5% wash of its own tone, so the row reads as one
     family instead of four unrelated colours. */
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--dtn-accent) 6%, transparent), transparent 72%),
    var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
  overflow: hidden;
}
.dtn-tile::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: color-mix(in srgb, var(--dtn-accent) 55%, transparent);
}
.dtn-tile.is-done {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-success-primary) 8%, transparent), transparent 72%),
    var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
}
.dtn-tile.is-done::before { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 70%, transparent); }
.dtn-tile.is-open {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, transparent), transparent 72%),
    var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
}
.dtn-tile.is-open::before { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 70%, transparent); }
.dtn-tile-label { font-size: 12.5px; line-height: 18px; color: var(--dsw-alias-label-caption); }
.dtn-tile-row { display: flex; align-items: baseline; gap: 8px; }
.dtn-tile-num {
  font-size: 30px;
  font-weight: 600;
  line-height: 36px;
  font-variant-numeric: tabular-nums;
}
.dtn-tile.is-done .dtn-tile-num { color: var(--dsw-alias-state-success-primary); }
.dtn-tile.is-open .dtn-tile-num { color: var(--dsw-alias-state-warn-primary); }
.dtn-tile-glyph { display: inline-flex; align-self: center; color: var(--dsw-alias-label-caption); }
.dtn-progress {
  box-sizing: border-box;
  width: 100%;
  height: 8px;
  margin-top: 2px;
  border-radius: 999px;
  background: var(--dsw-alias-interactive-bg-active);
  overflow: hidden;
}
.dtn-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg,
    var(--dtn-accent) 0%,
    var(--dsw-alias-state-success-primary) 100%);
  transition: width 0.25s ease;
}
.dtn-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: var(--dtn-line);
  border-radius: var(--dtn-radius-lg);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
}
.dtn-card-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
.dtn-card-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--dsw-alias-label-secondary);
}
.dtn-card-title::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--dtn-accent);
}
.dtn-card-note { font-size: 13px; color: var(--dsw-alias-label-caption); }
.dtn-card-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.dtn-card-day { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.dtn-summary {
  box-sizing: border-box;
  width: 100%;
  min-height: 156px;
  max-height: 260px;
  padding: 14px 16px;
  font: inherit;
  font-size: 13.5px;
  line-height: 22px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-specific-input-major);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dtn-radius);
  resize: vertical;
  white-space: pre-wrap;
}
.dtn-summary:focus { outline: none; border-color: var(--dtn-accent); }
.dtn-bars { display: flex; align-items: flex-end; gap: 8px; height: 128px; }
.dtn-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  height: 100%;
  cursor: pointer;
  background: transparent;
  border: 0;
  padding: 4px 0 0;
  border-radius: 8px;
  transition: background 0.14s ease;
}
.dtn-bar-col:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dtn-bar-stack {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
}
/* One hue per day: the track is "what was logged", the fill is "what got done". */
.dtn-bar {
  position: relative;
  display: flex;
  align-items: flex-end;
  width: 100%;
  max-width: 26px;
  min-height: 4px;
  overflow: hidden;
  border-radius: 6px 6px 3px 3px;
  background: color-mix(in srgb, var(--dtn-accent) 20%, transparent);
}
.dtn-bar-done {
  display: block;
  width: 100%;
  border-radius: 6px 6px 3px 3px;
  background: linear-gradient(180deg,
    var(--dtn-accent) 0%,
    color-mix(in srgb, var(--dtn-accent) 78%, transparent) 100%);
  transition: height 0.24s ease;
}
.dtn-bar-col.is-on { background: var(--dsw-alias-interactive-bg-active); }
.dtn-bar-col.is-on .dtn-bar { background: color-mix(in srgb, var(--dtn-accent) 30%, transparent); }
.dtn-bar-col.is-on .dtn-bar-label { color: var(--dsw-alias-label-primary); font-weight: 600; }
.dtn-bar-label {
  font-size: 11.5px;
  color: var(--dsw-alias-label-caption);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.dtn-bar-value {
  font-size: 11.5px;
  color: var(--dsw-alias-label-caption);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.dtn-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.dtn-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--dsw-alias-label-caption);
}
.dtn-legend-chip {
  width: 12px;
  height: 10px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--dtn-accent) 20%, transparent);
}
.dtn-legend-chip.is-done {
  background: linear-gradient(180deg,
    var(--dtn-accent) 0%,
    color-mix(in srgb, var(--dtn-accent) 78%, transparent) 100%);
}
.dtn-kv { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.dtn-kv code {
  padding: 1px 6px;
  font-size: 12px;
  border-radius: 5px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-markdown-inline-code, var(--dsw-alias-interactive-bg-hover));
}

/* =============================================================== composer == */

.dtn-composer {
  flex: none;
  box-sizing: border-box;
  padding: 0 32px 14px;
  background: var(--dsw-alias-bg-base);
  border-bottom: var(--dtn-line);
  animation: dtn-drop 0.16s ease-out;
}
@keyframes dtn-drop {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: none; }
}
.dtn-composer-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  max-width: var(--dtn-inner);
  margin: 0 auto;
  padding: 14px 16px;
  border: var(--dtn-line);
  border-radius: var(--dtn-radius-lg);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
  box-shadow: var(--dtn-shadow-1);
}
/* The top-right entry point. */
.dtn-head-add {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  margin-left: auto;
  padding: 7px 14px 7px 9px;
  font: inherit;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  color: var(--dsw-alias-label-on-color);
  background: var(--dtn-accent);
  border: 0;
  border-radius: 999px;
  box-shadow: var(--dtn-shadow-1);
  transition: box-shadow 0.14s ease, filter 0.14s ease;
}
.dtn-head-add:hover { box-shadow: var(--dtn-shadow-2); filter: brightness(1.05); }
.dtn-head-add.is-open {
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-interactive-bg-active);
  box-shadow: none;
}
.dtn-head-add-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 20px;
  height: 20px;
  font-size: 13px;
  line-height: 1;
  border-radius: 50%;
  background: color-mix(in srgb, var(--dsw-alias-label-on-color) 22%, transparent);
}
.dtn-head-add.is-open .dtn-head-add-plus { background: var(--dsw-alias-interactive-bg-hover); }
.dtn-composer-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
  max-width: var(--dtn-inner);
  margin: 0 auto;
  padding: 16px 18px;
  border: var(--dtn-line);
  border-radius: var(--dtn-radius-lg);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
  box-shadow: var(--dtn-shadow-1);
}
.dtn-composer-inner:focus-within { border-color: var(--dtn-accent); box-shadow: var(--dtn-shadow-2); }
.dtn-composer-row { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
.dtn-composer-main {
  flex: 1 1 280px;
  min-width: 180px;
  box-sizing: border-box;
  padding: 12px 16px;
  font: inherit;
  font-size: 15px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-specific-input-major);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dtn-radius);
}
.dtn-composer-main:focus { outline: none; border-color: var(--dtn-accent); }
.dtn-composer-main::placeholder { color: var(--dsw-alias-label-caption); }
.dtn-dot {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: var(--dtn-draft, var(--dtn-accent));
}
.dtn-composer-more { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
/* The head line of a composer that a calendar day opened. */
.dtn-composer-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
}
.dtn-composer-head-text { font-size: 13px; color: var(--dsw-alias-label-secondary); }
.dtn-composer-close {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 26px;
  height: 26px;
  margin-left: auto;
  padding: 0;
  font-size: 13px;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  background: transparent;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
}
.dtn-composer-close:hover {
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-interactive-bg-active);
}
.dtn-composer-extra { display: flex; flex-direction: column; gap: 10px; }
/* A queued link inside a composer or an editor: one line, removable. */
.dtn-link-text {
  max-width: 260px;
  overflow: hidden;
  font-size: 12px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-link);
}

/* ---------------------------------------------------------------- session -- */

.dtn-tool-btn {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  height: 28px;
  padding: 0 8px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  color: var(--dsw-alias-label-secondary);
  background: transparent;
  border: 0;
  border-radius: 8px;
}
.dtn-tool-btn:hover { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-hover); }
.dtn-tool-btn.is-on { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-interactive-bg-active); }
.dtn-tool-label { display: none; }
.dtn-link-panel {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0 0 10px;
  padding: 16px 18px 16px 22px;
  font-size: 13.5px;
  color: var(--dsw-alias-label-primary);
  border: var(--dtn-line);
  border-radius: var(--dtn-radius);
  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-card-fill));
  box-shadow: var(--dtn-shadow-1);
}
.dtn-link-panel::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: var(--dtn-radius) 0 0 var(--dtn-radius);
  background: var(--dtn-draft, var(--dtn-accent));
}
.dtn-link-head { display: flex; align-items: baseline; gap: 8px; }
.dtn-link-heading { flex: 1; min-width: 0; font-weight: 600; }
.dtn-select {
  box-sizing: border-box;
  max-width: 100%;
  padding: 6px 9px;
  font: inherit;
  font-size: 13px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-specific-input-major);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dtn-radius);
}

/* ------------------------------------------------------------------ misc --- */

.dtn-foot-note { font-size: 13px; color: var(--dsw-alias-label-caption); }
.dtn-hint { margin: 0; font-size: 13.5px; color: var(--dsw-alias-label-secondary); }
.dtn-panel-icon { display: block; }
`;

    /* ---------------------------------------------------------------- data -- */

    function pad2(value) {
      return value < 10 ? '0' + value : String(value);
    }

    /** Local calendar day of an epoch millisecond stamp, as YYYY-MM-DD. */
    function dayKeyOf(timestamp) {
      const date = new Date(timestamp);
      return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
    }

    function todayKey() {
      return dayKeyOf(Date.now());
    }

    function isFiniteNumber(value) {
      return typeof value === 'number' && Number.isFinite(value);
    }

    function messageOf(error) {
      if (error instanceof Error) return error.message;
      return String(error);
    }

    /** A sticky-note wash of one entry's colour, used as the note's own background. */
    function tint(color) {
      const hex = typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : PALETTE[0].value;
      return hex + '2E';
    }

    /** The same colour a step stronger, for a note's own outline. */
    function edgeTint(color) {
      const hex = typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : PALETTE[0].value;
      return hex + '5C';
    }

    /** A short, single-line view of a longer text. */
    function firstLine(text) {
      if (typeof text !== 'string') return '';
      const line = text.split('\n')[0].trim();
      return line.length > 80 ? line.slice(0, 80) + '…' : line;
    }

    let idSequence = 0;

    function newId() {
      idSequence += 1;
      return 't' + Date.now().toString(36) + '-' + idSequence.toString(36)
        + '-' + Math.random().toString(36).slice(2, 8);
    }

    function normalizeRef(raw) {
      if (!raw || typeof raw !== 'object') return null;
      if (typeof raw.sessionId !== 'string' || raw.sessionId === '') return null;
      return {
        sessionId: raw.sessionId,
        title: typeof raw.title === 'string' ? raw.title : '',
        excerpt: typeof raw.excerpt === 'string' ? raw.excerpt : '',
        at: isFiniteNumber(raw.at) ? raw.at : null,
      };
    }

    /** How many tags one entry may carry; keeps the note card readable. */
    const MAX_TAGS_PER_ITEM = 12;
    /** Caps for the progress trail an entry may accumulate. */
    const MAX_LOGS_PER_ITEM = 60;
    const MAX_LINKS_PER_ITEM = 24;
    /** One note may run long: it is a paragraph, not a line. */
    const MAX_LOG_LENGTH = 2000;

    /** Tags are plain text: trimmed, separator-free, short enough for a chip. */
    function normalizeTag(value) {
      if (typeof value !== 'string') return null;
      const cleaned = value.replace(/[,，、;；]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned === '') return null;
      return cleaned.length > 24 ? cleaned.slice(0, 24) : cleaned;
    }

    /** Tags compare case-insensitively, so "Work" and "work" are one tag. */
    function tagKey(value) {
      return value.toLowerCase();
    }

    function normalizeTags(value) {
      if (!Array.isArray(value)) return [];
      const tags = [];
      const seen = new Set();
      for (const entry of value) {
        const tag = normalizeTag(entry);
        if (tag === null) continue;
        const key = tagKey(tag);
        if (seen.has(key)) continue;
        seen.add(key);
        tags.push(tag);
        if (tags.length >= MAX_TAGS_PER_ITEM) break;
      }
      return tags;
    }

    /** Commas separate several tags; a space stays inside one tag. */
    function parseTagText(text) {
      if (typeof text !== 'string' || text.trim() === '') return [];
      return normalizeTags(text.split(/[,，、;；]/));
    }

    function mergeTags(current, extra) {
      return normalizeTags(current.concat(extra));
    }

    /** Every tag in use, most used first, so the picker offers the useful ones. */
    function tagOptionsOf(items) {
      const map = new Map();
      for (const entry of items) {
        for (const tag of entry.tags) {
          const key = tagKey(tag);
          const found = map.get(key);
          if (found === undefined) map.set(key, { key, name: tag, count: 1 });
          else found.count += 1;
        }
      }
      return Array.from(map.values()).sort((left, right) => (
        right.count - left.count || (left.name < right.name ? -1 : 1)
      ));
    }

    function hasTag(item, name) {
      const key = tagKey(name);
      return item.tags.some((tag) => tagKey(tag) === key);
    }

    /**
     * Whether one entry answers a lower-cased search term.
     *
     * The term is looked for in the words the entry actually carries — its text,
     * its tags, its links and its notes — so a half-remembered phrase still finds
     * the entry, whichever part of it was remembered. Notes and links are worth
     * searching because that is where the detail usually lives.
     */
    function entryMatches(item, term) {
      if (item.text.toLowerCase().includes(term)) return true;
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(term)) return true;
      }
      for (const link of item.links) {
        if (link.title.toLowerCase().includes(term) || link.url.toLowerCase().includes(term)) return true;
      }
      for (const log of item.logs) {
        if (log.text.toLowerCase().includes(term)) return true;
      }
      return false;
    }

    /**
     * A tag's own colour. It is derived from the tag's spelling, so the same tag
     * is the same colour on every surface and across restarts, with no extra
     * state to keep in sync.
     */
    function tagColor(name) {
      const key = tagKey(name);
      let hash = 2166136261;
      for (let index = 0; index < key.length; index += 1) {
        hash ^= key.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return PALETTE[(hash >>> 0) % PALETTE.length].value;
    }

    /** Chip style for one tag: its colour as text, wash and outline. */
    function tagStyle(name, selected) {
      const color = tagColor(name);
      if (selected === true) {
        return { background: color, borderColor: color, color: 'var(--dsw-alias-label-on-color)' };
      }
      return { background: color + '26', borderColor: color + '66', color };
    }

    /** One progress jot kept on an entry, so a long task shows how it moved. */
    function normalizeLog(raw) {
      if (raw === null || typeof raw !== 'object') return null;
      if (typeof raw.text !== 'string') return null;
      // Newlines are content here: keep them, only tidy the blank runs.
      const text = raw.text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
      if (text === '') return null;
      return {
        text: text.length > MAX_LOG_LENGTH ? text.slice(0, MAX_LOG_LENGTH) : text,
        at: isFiniteNumber(raw.at) ? raw.at : null,
      };
    }

    function normalizeLogs(value) {
      if (!Array.isArray(value)) return [];
      const logs = [];
      for (const entry of value) {
        const log = normalizeLog(entry);
        if (log !== null) logs.push(log);
        if (logs.length >= MAX_LOGS_PER_ITEM) break;
      }
      return logs;
    }

    /**
     * Read one link out of whatever was pasted. A whole line is fine — the
     * http(s) address is found inside it and the rest becomes the title — and a
     * bare `host/path` is accepted too, with `https://` filled in.
     *
     * @param text - clipboard text: an address, or an address plus a title.
     * @returns {url, title} or null when there is no address to find.
     */
    function parseLinkInput(text) {
      if (typeof text !== 'string') return null;
      const raw = text.trim();
      if (raw === '') return null;
      // Only a wrapping pair is peeled off: 【】「」 are kept, they are content.
      const trimEdges = (value) => {
        let text = value.trim();
        text = text.replace(/^[《（(<[「『"'“‘]/, '').replace(/[》）)>\]」』"'”’]$/, '');
        return text.replace(/[),.;，。；：]+$/, '').trim();
      };
      const found = /https?:\/\/[^\s"'<>]+/i.exec(raw);
      let url;
      let title;
      if (found !== null) {
        url = found[0];
        title = trimEdges((raw.slice(0, found.index) + ' ' + raw.slice(found.index + url.length)).trim());
      } else {
        // No scheme: accept a host with at least one dot, and infer https.
        const bare = /^([\w-]+(?:\.[\w-]+)+[^\s"'<>]*)$/.exec(raw);
        if (bare === null) return null;
        url = 'https://' + bare[1];
        title = '';
      }
      url = trimEdges(url).replace(/[),.;，。；：]+$/, '').replace(/[#?&]+$/, '');
      if (!/^https?:\/\/\S+$/i.test(url)) return null;
      if (title.length > 120) title = title.slice(0, 120);
      return { url, title };
    }

    /** One link kept on an entry; only http(s) addresses are accepted. */
    function normalizeLink(raw) {
      if (raw === null || typeof raw !== 'object') return null;
      const parsed = parseLinkInput(typeof raw.url === 'string' ? raw.url : '');
      if (parsed === null) return null;
      const explicit = typeof raw.title === 'string' ? raw.title.trim().slice(0, 120) : '';
      return {
        url: parsed.url,
        title: explicit === '' ? parsed.title : explicit,
        at: isFiniteNumber(raw.at) ? raw.at : null,
      };
    }

    function normalizeLinks(value) {
      if (!Array.isArray(value)) return [];
      const links = [];
      for (const entry of value) {
        const link = normalizeLink(entry);
        if (link !== null) links.push(link);
        if (links.length >= MAX_LINKS_PER_ITEM) break;
      }
      return links;
    }

    /** The host part of a link, used as the chip label when no title is given. */
    function hostOf(url) {
      const match = /^https?:\/\/([^/?#]+)/i.exec(url);
      return match === null ? url : match[1];
    }

    /** Progress of one entry: null when unset, otherwise a whole 0–100. */
    function normalizeProgress(raw) {
      if (!isFiniteNumber(raw)) return null;
      return Math.max(0, Math.min(100, Math.round(raw)));
    }

    function normalizeItem(raw) {
      if (!raw || typeof raw !== 'object') return null;
      if (typeof raw.id !== 'string' || raw.id === '') return null;
      if (typeof raw.text !== 'string') return null;
      const done = raw.done === true;
      const refs = [];
      if (Array.isArray(raw.refs)) {
        for (const entry of raw.refs) {
          const ref = normalizeRef(entry);
          if (ref !== null) refs.push(ref);
        }
      }
      const createdAt = isFiniteNumber(raw.createdAt) ? raw.createdAt : Date.now();
      return {
        id: raw.id,
        text: raw.text,
        parentId: typeof raw.parentId === 'string' && raw.parentId !== '' ? raw.parentId : null,
        color: typeof raw.color === 'string' && raw.color !== '' ? raw.color : PALETTE[0].value,
        done,
        createdAt,
        day: typeof raw.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.day) ? raw.day : dayKeyOf(createdAt),
        completedAt: done && isFiniteNumber(raw.completedAt) ? raw.completedAt : null,
        collapsed: raw.collapsed === true,
        refs,
        tags: normalizeTags(raw.tags),
        links: normalizeLinks(raw.links),
        logs: normalizeLogs(raw.logs),
        progress: normalizeProgress(raw.progress),
      };
    }

    function readItems(value) {
      if (!Array.isArray(value)) return [];
      const items = [];
      for (const entry of value) {
        const item = normalizeItem(entry);
        if (item !== null) items.push(item);
      }
      return items;
    }

    /** Day summaries: a day key mapped to the text the user kept for that day. */
    function normalizeNotes(value) {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return {};
      const notes = {};
      for (const key of Object.keys(value)) {
        const entry = value[key];
        if (entry === null || typeof entry !== 'object') continue;
        if (typeof entry.text !== 'string' || entry.text.trim() === '') continue;
        notes[key] = { text: entry.text, at: isFiniteNumber(entry.at) ? entry.at : null };
      }
      return notes;
    }

    /** Browser mirror of the durable document; a disabled storage must not break the page. */
    function readLocalState(key) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) return null;
        return { items: readItems(parsed.items), notes: normalizeNotes(parsed.notes) };
      } catch (error) {
        return null;
      }
    }

    function writeLocalState(key, items, notes) {
      try {
        window.localStorage.setItem(key, JSON.stringify({ version: SCHEMA_VERSION, items, notes }));
      } catch (error) {
        // A full or disabled store only costs the browser mirror; the Host copy is authoritative.
      }
    }

    /** Open entries first, then by creation order, so a check never reorders history. */
    function compareSiblings(left, right) {
      if (left.done !== right.done) return left.done ? 1 : -1;
      if (left.createdAt !== right.createdAt) return left.createdAt - right.createdAt;
      if (left.id === right.id) return 0;
      return left.id < right.id ? -1 : 1;
    }

    function countDescendants(childrenMap, id) {
      let total = 0;
      for (const child of childrenMap.get(id) || []) total += 1 + countDescendants(childrenMap, child.id);
      return total;
    }

    /**
     * The colour a new entry takes: the palette step after the newest entry, so
     * consecutive notes never repeat and the wall stays readable.
     */
    function nextPaletteColor(items) {
      let latest = null;
      for (const entry of items) {
        if (latest === null
          || entry.createdAt > latest.createdAt
          || (entry.createdAt === latest.createdAt && entry.id > latest.id)) latest = entry;
      }
      if (latest === null) return PALETTE[0].value;
      const index = PALETTE.findIndex((color) => color.value === latest.color);
      return PALETTE[(index + 1) % PALETTE.length].value;
    }

    /** One activity record; past days stay readable in data/history.jsonl. */
    function eventOf(kind, item, extra) {
      const record = {
        at: Date.now(),
        day: todayKey(),
        kind,
        id: item.id,
        text: firstLine(item.text),
        color: item.color,
        parentId: item.parentId,
        done: item.done === true,
        tags: item.tags.join(', '),
      };
      if (extra !== undefined) Object.assign(record, extra);
      return record;
    }

    /* --------------------------------------------------------------- store -- */

    /**
     * The one document both registrations read and write. The Host file is
     * authoritative; every change is mirrored into browser storage and queued
     * to the Host routes.
     */
    const store = (function createStore() {
      let snapshot = {
        revision: 0,
        items: [],
        notes: {},
        loaded: false,
        source: 'loading',
        path: null,
        historyPath: null,
        directory: null,
        defaultDirectory: null,
        journalLines: 0,
        corrupt: false,
        error: null,
        saving: false,
        savedAt: null,
        // Which backend the Host reported, and where its data lives.
        storage: null,
        dbPath: null,
        storageNote: null,
        migrated: null,
      };
      const listeners = new Set();
      let loading = null;
      let pendingEvents = [];
      let saveTimer = null;
      let flushing = false;
      /**
       * What the Host already holds, so a save can send only what changed
       * instead of the whole document. A fingerprint is the entry's own JSON,
       * which is the same unit the Host compares by.
       */
      let flushedDocs = new Map();
      let flushedNotes = '{}';
      /**
       * Whether this Host half understands row-level ops. A Host that does not
       * advertise them gets whole documents, so an older installed half still
       * stores what the page writes.
       */
      let serverTakesOps = false;

      function publish(patch) {
        snapshot = { ...snapshot, ...patch, revision: snapshot.revision + 1 };
        for (const listener of Array.from(listeners)) {
          try {
            listener();
          } catch (error) {
            // One broken subscriber must not stop the others.
          }
        }
      }

      function scheduleSave() {
        if (saveTimer !== null) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          saveTimer = null;
          void flush();
        }, SAVE_DELAY_MS);
      }

      function commit(items, events) {
        for (const event of events || []) pendingEvents.push(event);
        publish({ items });
        scheduleSave();
      }

      /** Record what the Host now considers stored. */
      function acceptFlushed(items, notes) {
        flushedDocs = new Map(items.map((entry) => [entry.id, JSON.stringify(entry)]));
        flushedNotes = JSON.stringify(notes);
      }

      /**
       * The row-level changes since the last accepted save.
       *
       * This is what keeps a save proportional to the edit rather than to the
       * size of the whole list: one entry changes, one row travels.
       */
      function pendingOps() {
        const ops = [];
        const seen = new Set();
        for (const entry of snapshot.items) {
          seen.add(entry.id);
          const text = JSON.stringify(entry);
          if (flushedDocs.get(entry.id) !== text) ops.push({ t: 'put', v: entry });
        }
        for (const id of flushedDocs.keys()) {
          if (!seen.has(id)) ops.push({ t: 'del', id });
        }
        const notesText = JSON.stringify(snapshot.notes);
        if (notesText !== flushedNotes) ops.push({ t: 'notes', v: snapshot.notes });
        return ops;
      }

      async function flush() {
        if (flushing) {
          scheduleSave();
          return;
        }
        flushing = true;
        const ops = pendingOps();
        if (ops.length === 0 && pendingEvents.length === 0) {
          // Nothing changed since the last accepted save.
          flushing = false;
          return;
        }
        const items = snapshot.items;
        const notes = snapshot.notes;
        const events = pendingEvents;
        pendingEvents = [];
        writeLocalState(LOCAL_KEY, items, notes);
        if (snapshot.source !== 'file') {
          flushing = false;
          return;
        }
        publish({ saving: true });
        try {
          const body = serverTakesOps === true
            ? { version: SCHEMA_VERSION, ops, events }
            : { version: SCHEMA_VERSION, items, notes, events };
          const response = await fetch(ROUTE + '/state', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!response.ok) throw new Error('HTTP ' + response.status);
          acceptFlushed(items, notes);
          publish({ saving: false, savedAt: Date.now(), error: null });
        } catch (error) {
          // Keep the records: the next write re-sends them.
          pendingEvents = events.concat(pendingEvents);
          publish({ saving: false, error: messageOf(error) });
        } finally {
          flushing = false;
          if (pendingEvents.length > 0) scheduleSave();
        }
      }

      async function load() {
        try {
          const response = await fetch(ROUTE + '/state', {
            credentials: 'include',
            headers: { accept: 'application/json' },
          });
          if (!response.ok) throw new Error('HTTP ' + response.status);
          const payload = await response.json();
          const body = payload !== null && typeof payload === 'object' ? payload : {};
          const items = readItems(body.items);
          const notes = normalizeNotes(body.notes);
          const fromBrowser = readLocalState(LEGACY_KEY) || readLocalState(LOCAL_KEY);
          if (items.length === 0 && fromBrowser !== null && fromBrowser.items.length > 0) {
            // First run after the durable document appeared: adopt what the
            // browser already held instead of starting empty. The Host holds
            // nothing yet, so the next save must send the whole list.
            flushedDocs = new Map();
            flushedNotes = '{}';
            publish({
              items: fromBrowser.items,
              notes: Object.keys(notes).length === 0 ? fromBrowser.notes : notes,
              loaded: true,
              source: 'file',
              path: typeof body.path === 'string' ? body.path : null,
              historyPath: typeof body.historyPath === 'string' ? body.historyPath : null,
              directory: typeof body.directory === 'string' ? body.directory : null,
              defaultDirectory: typeof body.defaultDirectory === 'string' ? body.defaultDirectory : null,
              storage: typeof body.storage === 'string' ? body.storage : null,
              dbPath: typeof body.dbPath === 'string' ? body.dbPath : null,
              storageNote: typeof body.storageNote === 'string' ? body.storageNote : null,
              migrated: body.migrated === null || body.migrated === undefined ? null : body.migrated,
              corrupt: false,
              error: null,
            });
            pendingEvents.push({
              at: Date.now(),
              day: todayKey(),
              kind: 'migrate',
              count: fromBrowser.items.length,
            });
            scheduleSave();
            return;
          }
          // The Host is now in step with what was just read.
          serverTakesOps = body.opsAccepted === true;
          acceptFlushed(items, notes);
          publish({
            items,
            notes,
            loaded: true,
            source: 'file',
            path: typeof body.path === 'string' ? body.path : null,
            historyPath: typeof body.historyPath === 'string' ? body.historyPath : null,
            directory: typeof body.directory === 'string' ? body.directory : null,
            defaultDirectory: typeof body.defaultDirectory === 'string' ? body.defaultDirectory : null,
            storage: typeof body.storage === 'string' ? body.storage : null,
            dbPath: typeof body.dbPath === 'string' ? body.dbPath : null,
            storageNote: typeof body.storageNote === 'string' ? body.storageNote : null,
            migrated: body.migrated === null || body.migrated === undefined ? null : body.migrated,
            journalLines: isFiniteNumber(body.journalLines) ? body.journalLines : 0,
            corrupt: body.corrupt === true,
            error: null,
          });
        } catch (error) {
          const fallback = readLocalState(LOCAL_KEY) || readLocalState(LEGACY_KEY);
          // Nothing on the Host is known to be stored, so the next save sends
          // the whole list once the connection comes back.
          flushedDocs = new Map();
          flushedNotes = '{}';
          publish({
            items: fallback === null ? [] : fallback.items,
            notes: fallback === null ? {} : fallback.notes,
            loaded: true,
            source: 'browser',
            path: null,
            historyPath: null,
            directory: null,
            defaultDirectory: null,
            storage: null,
            dbPath: null,
            storageNote: null,
            migrated: null,
            journalLines: 0,
            corrupt: false,
            error: messageOf(error),
          });
        }
      }

      function setDone(id, done) {
        const now = Date.now();
        let changed = null;
        const items = snapshot.items.map((entry) => {
          if (entry.id !== id) return entry;
          if (entry.done === done) return entry;
          changed = { ...entry, done, completedAt: done ? now : null };
          return changed;
        });
        if (changed === null) return false;
        commit(items, [eventOf(changed.done ? 'complete' : 'reopen', changed)]);
        return true;
      }

      return {
        subscribe(listener) {
          listeners.add(listener);
          return () => { listeners.delete(listener); };
        },
        getSnapshot() {
          return snapshot;
        },
        ensureLoaded() {
          if (loading === null) loading = load();
          return loading;
        },
        itemById(id) {
          for (const entry of snapshot.items) if (entry.id === id) return entry;
          return undefined;
        },
        createItem(draft, parentId) {
          const now = Date.now();
          const parent = parentId === null || parentId === undefined ? null : parentId;
          const item = {
            id: newId(),
            text: draft.text,
            parentId: parent,
            color: typeof draft.color === 'string' && draft.color !== ''
              ? draft.color
              : nextPaletteColor(snapshot.items),
            done: draft.done === true,
            createdAt: now,
            day: typeof draft.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(draft.day)
              ? draft.day
              : dayKeyOf(now),
            completedAt: draft.done === true ? now : null,
            collapsed: false,
            refs: Array.isArray(draft.refs) ? draft.refs : [],
            tags: normalizeTags(draft.tags),
            // A new entry may already arrive with its links and its first
            // progress note, so adding both is one action instead of two.
            links: normalizeLinks(draft.links),
            logs: normalizeLogs(draft.logs),
            progress: normalizeProgress(draft.progress),
          };
          const base = parent === null
            ? snapshot.items
            : snapshot.items.map((entry) => (entry.id === parent ? { ...entry, collapsed: false } : entry));
          commit(base.concat([item]), [eventOf('create', item)]);
          return item;
        },
        /** Colour the next new entry will take, so a form can show it up front. */
        nextColor() {
          return nextPaletteColor(snapshot.items);
        },
        addTags(id, list) {
          const extra = normalizeTags(list);
          if (extra.length === 0) return;
          let changed = null;
          const items = snapshot.items.map((entry) => {
            if (entry.id !== id) return entry;
            changed = { ...entry, tags: mergeTags(entry.tags, extra) };
            return changed;
          });
          if (changed === null) return;
          commit(items, [eventOf('tag', changed)]);
        },
        /** Attach one reference link; refuses anything that is not an http(s) URL. */
        addLink(id, url, title) {
          const link = normalizeLink({ url, title, at: Date.now() });
          if (link === null) return false;
          let changed = null;
          const items = snapshot.items.map((entry) => {
            if (entry.id !== id) return entry;
            const existing = entry.links.filter((candidate) => candidate.url !== link.url);
            changed = { ...entry, links: existing.concat([link]).slice(-MAX_LINKS_PER_ITEM) };
            return changed;
          });
          if (changed === null) return false;
          commit(items, [eventOf('link-add', changed, { url: link.url })]);
          return true;
        },
        removeLink(id, index) {
          const item = this.itemById(id);
          if (item === undefined) return;
          const link = item.links[index];
          if (link === undefined) return;
          const links = item.links.slice();
          links.splice(index, 1);
          const changed = { ...item, links };
          commit(snapshot.items.map((entry) => (entry.id === id ? changed : entry)),
            [eventOf('link-remove', changed, { url: link.url })]);
        },
        /** Append one progress jot, so a long entry keeps its own trail. */
        addLog(id, text) {
          const log = normalizeLog({ text, at: Date.now() });
          if (log === null) return false;
          let changed = null;
          const items = snapshot.items.map((entry) => {
            if (entry.id !== id) return entry;
            changed = { ...entry, logs: entry.logs.concat([log]).slice(-MAX_LOGS_PER_ITEM) };
            return changed;
          });
          if (changed === null) return false;
          commit(items, [eventOf('log-add', changed, { note: firstLine(log.text) })]);
          return true;
        },
        /**
         * Rewrite one note's text in place. The moment it was written is part
         * of the trail, so editing the words keeps its place in the timeline.
         */
        updateLog(id, index, text) {
          const item = this.itemById(id);
          if (item === undefined) return false;
          const previous = item.logs[index];
          if (previous === undefined) return false;
          const log = normalizeLog({ text, at: previous.at });
          if (log === null) return false;
          if (log.text === previous.text) return true;
          const logs = item.logs.slice();
          logs[index] = log;
          const changed = { ...item, logs };
          commit(snapshot.items.map((entry) => (entry.id === id ? changed : entry)),
            [eventOf('log-edit', changed, { note: firstLine(log.text) })]);
          return true;
        },
        removeLog(id, index) {
          const item = this.itemById(id);
          if (item === undefined) return;
          const log = item.logs[index];
          if (log === undefined) return;
          const logs = item.logs.slice();
          logs.splice(index, 1);
          const changed = { ...item, logs };
          commit(snapshot.items.map((entry) => (entry.id === id ? changed : entry)),
            [eventOf('log-remove', changed)]);
        },
        /**
         * Set or clear one entry's progress. 100% completes it; anything below
         * 100 (or a new value on a finished entry) reopens it, so the checkbox
         * and the percentage can never contradict each other. Clearing the
         * value leaves the completion state alone.
         */
        setProgress(id, value) {
          const item = this.itemById(id);
          if (item === undefined) return false;
          let next = null;
          if (value !== null && value !== undefined) {
            const number = Math.round(Number(value));
            if (!Number.isFinite(number)) return false;
            next = Math.max(0, Math.min(100, number));
          }
          const now = Date.now();
          const done = next === null ? item.done : next === 100;
          const changed = {
            ...item,
            progress: next,
            done,
            completedAt: done ? (item.done && item.completedAt !== null ? item.completedAt : now) : null,
          };
          const before = item.progress === null ? 'none' : item.progress;
          const after = next === null ? 'none' : next;
          if (before === after && done === item.done) return false;
          commit(snapshot.items.map((entry) => (entry.id === id ? changed : entry)),
            [eventOf('progress', changed, { from: before, to: after })]);
          return true;
        },
        /** Rename one tag everywhere; returns the applied name, or null when it was refused. */
        renameTag(from, to) {
          const next = normalizeTag(to);
          if (next === null) return null;
          if (tagKey(next) === tagKey(from)) return from;
          let touched = 0;
          const items = snapshot.items.map((entry) => {
            if (!hasTag(entry, from)) return entry;
            touched += 1;
            const renamed = entry.tags.map((tag) => (tagKey(tag) === tagKey(from) ? next : tag));
            return { ...entry, tags: normalizeTags(renamed) };
          });
          if (touched === 0) return null;
          commit(items, [{
            at: Date.now(),
            day: todayKey(),
            kind: 'tag-rename',
            from,
            to: next,
            entries: touched,
          }]);
          return next;
        },
        /** Re-home one entry to another day, so carried-over work can be pulled forward. */
        moveToDay(id, target) {
          if (typeof target !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(target)) return;
          let changed = null;
          const items = snapshot.items.map((entry) => {
            if (entry.id !== id) return entry;
            changed = { ...entry, day: target };
            return changed;
          });
          if (changed === null) return;
          commit(items, [eventOf('move', changed, { to: target })]);
        },
        /** Keep, or clear, the summary the user wrote for one day. */
        saveNote(day, text) {
          const next = { ...snapshot.notes };
          const value = typeof text === 'string' ? text.trim() : '';
          if (value === '') delete next[day];
          else next[day] = { text, at: Date.now() };
          publish({ notes: next });
          pendingEvents.push({
            at: Date.now(),
            day: todayKey(),
            kind: 'summary',
            forDay: day,
            chars: value.length,
          });
          scheduleSave();
        },
        /** Move the data home; the Host carries the existing files across. */
        async setDirectory(directory) {
          const response = await fetch(ROUTE + '/location', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ directory: typeof directory === 'string' ? directory : '' }),
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            const message = payload !== null && typeof payload === 'object' && typeof payload.error === 'string'
              ? payload.error
              : 'HTTP ' + response.status;
            throw new Error(message);
          }
          // Re-read from the new directory; the moved document is the same one.
          loading = null;
          await load();
          return {
            directory: typeof payload.directory === 'string' ? payload.directory : null,
            moved: Array.isArray(payload.moved) ? payload.moved : [],
            skipped: Array.isArray(payload.skipped) ? payload.skipped : [],
            cleared: payload.cleared === true,
          };
        },
        updateItem(id, draft, doneChanged, done) {
          const now = Date.now();
          let changed = null;
          const items = snapshot.items.map((entry) => {
            if (entry.id !== id) return entry;
            const next = { ...entry, text: draft.text, color: draft.color };
            if (Array.isArray(draft.tags)) next.tags = normalizeTags(draft.tags);
            if (draft.progress !== undefined) next.progress = normalizeProgress(draft.progress);
            if (doneChanged) {
              next.done = done === true;
              next.completedAt = done === true ? now : null;
            }
            changed = next;
            return next;
          });
          if (changed === null) return;
          const events = [eventOf('update', changed)];
          if (doneChanged) events.push(eventOf(changed.done ? 'complete' : 'reopen', changed));
          commit(items, events);
        },
        setDone,
        toggleDone(id) {
          const item = this.itemById(id);
          if (item === undefined) return;
          setDone(id, !item.done);
        },
        toggleCollapse(id) {
          commit(snapshot.items.map((entry) => (
            entry.id === id ? { ...entry, collapsed: !entry.collapsed } : entry
          )), []);
        },
        removeItem(id) {
          const item = this.itemById(id);
          const doomed = new Set([id]);
          let grew = true;
          while (grew) {
            grew = false;
            for (const entry of snapshot.items) {
              if (entry.parentId !== null && doomed.has(entry.parentId) && !doomed.has(entry.id)) {
                doomed.add(entry.id);
                grew = true;
              }
            }
          }
          const events = item === undefined ? [] : [eventOf('delete', item, { removed: doomed.size })];
          commit(snapshot.items.filter((entry) => !doomed.has(entry.id)), events);
        },
        addRef(id, ref) {
          let changed = null;
          const items = snapshot.items.map((entry) => {
            if (entry.id !== id) return entry;
            const refs = entry.refs.filter((candidate) => candidate.sessionId !== ref.sessionId).concat([ref]);
            changed = { ...entry, refs };
            return changed;
          });
          if (changed === null) return;
          commit(items, [eventOf('link', changed, {
            sessionId: ref.sessionId,
            sessionTitle: ref.title,
            excerpt: ref.excerpt,
          })]);
        },
        removeRef(id, index) {
          const item = this.itemById(id);
          if (item === undefined) return;
          const ref = item.refs[index];
          if (ref === undefined) return;
          const refs = item.refs.slice();
          refs.splice(index, 1);
          const changed = { ...item, refs };
          commit(snapshot.items.map((entry) => (entry.id === id ? changed : entry)),
            [eventOf('unlink', changed, { sessionId: ref.sessionId })]);
        },
      };
    })();

    /** Open state of the composer panel, shared by the button and the panel. */
    const linkPanel = (function createLinkPanel() {
      let snapshot = { open: false, sessionId: null, draft: '', openedAt: 0 };
      const listeners = new Set();
      function publish(patch) {
        snapshot = { ...snapshot, ...patch };
        for (const listener of Array.from(listeners)) {
          try {
            listener();
          } catch (error) {
            // One broken subscriber must not stop the others.
          }
        }
      }
      return {
        subscribe(listener) {
          listeners.add(listener);
          return () => { listeners.delete(listener); };
        },
        getSnapshot() {
          return snapshot;
        },
        toggle(sessionId, draft) {
          if (snapshot.open && snapshot.sessionId === sessionId) publish({ open: false });
          else publish({ open: true, sessionId, draft, openedAt: Date.now() });
        },
        close() {
          publish({ open: false });
        },
      };
    })();

    /** Assigned once the Client workspace service is available. */
    let openSession = function openSessionUnavailable() {};
    /** Whether a Session link can actually be followed right now. */
    let canOpenSession = false;
    /** Native folder picker for the data location; unavailable without the workspace service. */
    let pickDirectory = async function pickDirectoryUnavailable() { return null; };
    /** Whether that picker can be offered right now. */
    let canPickDirectory = false;

    /**
     * One hand-off of a day's record to the agent. The page fills the composer
     * from the conversation, so the button lives in the session scope and this
     * store carries the prompt across the panel switch.
     */
    const summaryRequest = (function createSummaryRequest() {
      let pending = null;
      const listeners = new Set();
      function publish() {
        for (const listener of Array.from(listeners)) {
          try {
            listener();
          } catch (error) {
            // One broken subscriber must not stop the others.
          }
        }
      }
      return {
        subscribe(listener) {
          listeners.add(listener);
          return () => { listeners.delete(listener); };
        },
        getSnapshot() {
          return pending;
        },
        request(prompt) {
          pending = typeof prompt === 'string' && prompt !== '' ? prompt : null;
          publish();
        },
        clear() {
          if (pending === null) return;
          pending = null;
          publish();
        },
      };
    })();

    /* --------------------------------------------------------------- glyphs -- */

    function stroke(d, width) {
      return h('path', {
        d,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: width,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      });
    }

    function CaretGlyph({ open }) {
      return h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', focusable: 'false' },
        stroke(open ? 'M4 6.2l4 4 4-4' : 'M6.2 4l4 4-4 4', 1.5));
    }

    function CheckGlyph({ size }) {
      return h('svg', {
        viewBox: '0 0 12 12', width: size || 10, height: size || 10, 'aria-hidden': 'true', focusable: 'false',
      }, stroke('M2 6.3l2.4 2.4L10 3.3', 1.9));
    }

    function PlusGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', focusable: 'false' },
        stroke('M8 3.5v9M3.5 8h9', 1.4));
    }

    function SearchGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', focusable: 'false' },
        stroke('M7.2 2.8a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8z', 1.4),
        stroke('M10.5 10.5l2.7 2.7', 1.5));
    }

    function PencilGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', focusable: 'false' },
        stroke('M10.8 3.1l2.1 2.1-7 7-2.6.5.5-2.6 7-7z', 1.4));
    }

    function TrashGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, 'aria-hidden': 'true', focusable: 'false' },
        stroke('M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.5 8h5l.5-8', 1.4));
    }

    function LinkNoteGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 15, height: 15, 'aria-hidden': 'true', focusable: 'false' },
        stroke('M5.4 2.6h7v10.8h-7z', 1.3),
        stroke('M4.2 4.4h-.9v9h6.2v-.9', 1.3),
        stroke('M7.2 5.8h3.4M7.2 8.2h3.4M7.2 10.6h2', 1.2));
    }

    /** Sidebar entry icon; the shell supplies the edge length and the row colour. */
    function TodoPanelIcon(props) {
      const size = typeof props.size === 'number' && props.size > 0 ? props.size : 16;
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size,
        className: 'dtn-panel-icon', 'aria-hidden': 'true', focusable: 'false',
      },
      stroke('M2.4 4.5l1.4 1.4 2.3-2.6', 1.4),
      stroke('M2.4 10.5l1.4 1.4 2.3-2.6', 1.4),
      stroke('M8.4 5h5.2M8.4 11h5.2', 1.4));
    }

    /* ----------------------------------------------------------- components -- */

    function IconButton({ label, glyph, onClick, danger, expanded }) {
      const props = {
        type: 'button',
        className: 'dtn-icon-btn' + (danger ? ' is-danger' : ''),
        title: label,
        'aria-label': label,
        onClick,
      };
      if (expanded !== undefined) props['aria-expanded'] = expanded;
      return h('button', props, glyph);
    }

    /**
     * One create/edit form. The same component composes a new root entry, a new
     * sub-entry, and the edit of an existing entry. Colour is not offered here:
     * a new entry takes the next palette colour, an edited one keeps its own.
     */
    function NoteEditor(props) {
      const api = props.api;
      const t = api.t;
      const isEdit = props.mode === 'edit';
      const item = isEdit ? props.item : null;
      const parentId = props.parentId === undefined ? null : props.parentId;
      const [text, setText] = useState(isEdit ? item.text : '');
      const [color, setColor] = useState(isEdit ? item.color : api.nextColor());
      const [tags, setTags] = useState(isEdit ? item.tags : []);
      const [tagText, setTagText] = useState('');
      const [done, setDone] = useState(isEdit ? item.done : false);
      const inputRef = useRef(null);

      useEffect(() => {
        const node = inputRef.current;
        if (node !== null && typeof node.focus === 'function') node.focus();
      }, []);

      const close = useCallback(() => {
        if (isEdit) api.setEditingItemId(null);
        else if (parentId !== null) api.setChildParentId(null);
        else setText('');
      }, [api, isEdit, parentId]);

      const commit = useCallback(() => {
        const value = text.trim();
        if (value === '') {
          const node = inputRef.current;
          if (node !== null && typeof node.focus === 'function') node.focus();
          return;
        }
        const finalTags = mergeTags(tags, parseTagText(tagText));
        if (isEdit) {
          api.updateItem(item.id, { text: value, color, tags: finalTags }, done !== item.done, done);
          api.setEditingItemId(null);
          return;
        }
        // A sub-entry joins the day its parent belongs to.
        const day = props.parentDay === undefined ? api.today : props.parentDay;
        api.createItem({ text: value, color, tags: finalTags, done, day }, parentId);
        setText('');
        setTags([]);
        setTagText('');
        setDone(false);
        setColor(api.nextColor());
        if (parentId !== null) api.setChildParentId(null);
        const node = inputRef.current;
        if (node !== null && typeof node.focus === 'function') node.focus();
      }, [api, color, done, isEdit, item, parentId, props.parentDay, tagText, tags, text]);

      const toggleTag = (name) => {
        setTags((previous) => (
          previous.some((tag) => tagKey(tag) === tagKey(name))
            ? previous.filter((tag) => tagKey(tag) !== tagKey(name))
            : normalizeTags(previous.concat([name]))
        ));
      };

      const addTypedTags = () => {
        const parsed = parseTagText(tagText);
        if (parsed.length === 0) return;
        setTags((previous) => mergeTags(previous, parsed));
        setTagText('');
      };

      const onKeyDown = (event) => {
        if (event.key === 'Enter' && event.shiftKey === false) {
          event.preventDefault();
          commit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          close();
        }
      };

      const placeholder = isEdit ? t('placeholderEdit') : parentId === null ? t('placeholderNew') : t('placeholderChild');

      // Existing tags are one click away; a typed tag is added with Enter or by
      // leaving the field, so the composer's Enter-to-save stays untouched.
      const tagChips = [h('span', { key: 'label', className: 'dtn-foot-note' }, t('tagsLabel'))];
      for (const option of api.tagOptions.slice(0, 8)) {
        const chosen = tags.some((tag) => tagKey(tag) === option.key);
        tagChips.push(h('button', {
          key: 'option:' + option.key,
          type: 'button',
          className: 'dtn-tag' + (chosen ? ' is-on' : ''),
          style: tagStyle(option.name, chosen),
          title: t('tagSuggest'),
          onClick: () => { toggleTag(option.name); },
        }, option.name + ' ' + option.count));
      }
      tagChips.push(h('input', {
        key: 'tag-input',
        className: 'dtn-tag-input',
        type: 'text',
        value: tagText,
        placeholder: t('tagPlaceholder'),
        'aria-label': t('tagPlaceholder'),
        onChange: (event) => { setTagText(event.target.value); },
        onKeyDown: (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            addTypedTags();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            close();
          }
        },
        onBlur: addTypedTags,
      }));
      for (const tag of tags) {
        if (api.tagOptions.some((option) => option.key === tagKey(tag))) continue;
        tagChips.push(h('span', {
          key: 'new:' + tagKey(tag),
          className: 'dtn-tag is-on',
          style: tagStyle(tag, true),
        }, tag));
      }

      return h('div', { className: 'dtn-editor' }, [
        h('textarea', {
          key: 'text',
          ref: inputRef,
          className: 'dtn-field',
          rows: parentId === null && !isEdit ? 2 : 2,
          value: text,
          placeholder,
          'aria-label': placeholder,
          onChange: (event) => { setText(event.target.value); },
          onKeyDown,
        }),
        h('div', { key: 'tags', className: 'dtn-tags' }, tagChips),
        h('div', { key: 'actions', className: 'dtn-editor-row' }, [
          h('span', { key: 'spacer', style: { flex: '1 1 auto' } }),
          h('button', { key: 'save', type: 'button', className: 'dtn-btn is-primary', onClick: commit },
            isEdit ? t('save') : t('add')),
          h('button', { key: 'cancel', type: 'button', className: 'dtn-btn', onClick: close }, t('cancel')),
        ]),
        h('label', { key: 'today', className: 'dtn-check-line' }, [
          h('input', {
            key: 'cb',
            className: 'dtn-cb',
            type: 'checkbox',
            checked: done,
            onChange: (event) => { setDone(event.target.checked); },
          }),
          h('span', { key: 'label' }, t('countToday')),
        ]),
      ]);
    }

    /** Inline delete confirmation; nothing is removed before the second press. */
    function ConfirmBar({ api, item }) {
      const t = api.t;
      const descendants = countDescendants(api.childrenMap, item.id);
      return h('div', { className: 'dtn-inline-panel' }, [
        h('span', {
          key: 'question',
        }, descendants > 0 ? t('confirmDeleteWithChildren', { count: descendants }) : t('confirmDelete')),
        h('span', { key: 'spacer', style: { flex: '1 1 auto' } }),
        h('button', {
          key: 'yes',
          type: 'button',
          className: 'dtn-btn is-danger',
          onClick: () => { api.removeItem(item.id); api.setConfirmingId(null); },
        }, t('confirm')),
        h('button', {
          key: 'no',
          type: 'button',
          className: 'dtn-btn',
          onClick: () => { api.setConfirmingId(null); },
        }, t('cancel')),
      ]);
    }

    /** The Session links one note carries, so a task can lead back to its conversation. */
    function RefRow({ api, item }) {
      const t = api.t;
      return h('div', { className: 'dtn-refs' }, item.refs.map((ref, index) => h('span', {
        key: ref.sessionId + ':' + index,
        className: 'dtn-ref',
      }, [
        h('button', {
          key: 'open',
          type: 'button',
          className: 'dtn-ref-open',
          title: ref.excerpt === '' ? t('refOpen') : t('refOpen') + '：' + ref.excerpt,
          disabled: api.canOpenSession !== true,
          onClick: () => { api.openSession(ref.sessionId); },
        }, t('refLabel') + '：' + (ref.title === '' ? firstLine(ref.sessionId) || ref.sessionId : ref.title)),
        h('button', {
          key: 'drop',
          type: 'button',
          className: 'dtn-ref-drop',
          title: t('refRemove'),
          'aria-label': t('refRemove'),
          onClick: () => { api.removeRef(item.id, index); },
        }, '×'),
      ])));
    }

    /* ------------------------------------------------------------ calendar -- */

    const WEEKDAY_KEYS = ['weekdaySun', 'weekdayMon', 'weekdayTue', 'weekdayWed', 'weekdayThu', 'weekdayFri', 'weekdaySat'];
    /** Date groups rendered before the "earlier days" control appears. */
    const FIRST_GROUPS = 6;
    /** How many more groups one press reveals. */
    const MORE_GROUPS = 14;

    /** HH:MM of an epoch stamp. */
    function clockOf(timestamp) {
      if (!isFiniteNumber(timestamp)) return '';
      const date = new Date(timestamp);
      return pad2(date.getHours()) + ':' + pad2(date.getMinutes());
    }

    /** Shift one YYYY-MM-DD key by whole days. */
    function shiftDay(key, delta) {
      const date = new Date(key + 'T00:00:00');
      if (Number.isNaN(date.getTime())) return key;
      date.setDate(date.getDate() + delta);
      return dayKeyOf(date.getTime());
    }

    /** Whole days between two keys, later minus earlier. */
    function daysBetween(fromKey, toKey) {
      const from = new Date(fromKey + 'T00:00:00');
      const to = new Date(toKey + 'T00:00:00');
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
      return Math.round((to.getTime() - from.getTime()) / 86400000);
    }

    /** 今天 / 昨天 / 2026-11-14 星期五 */
    function dayLabel(key, t) {
      const today = todayKey();
      if (key === today) return t('labelToday');
      if (key === shiftDay(today, -1)) return t('labelYesterday');
      if (key === shiftDay(today, 1)) return t('labelTomorrow');
      const date = new Date(key + 'T00:00:00');
      if (Number.isNaN(date.getTime())) return key;
      const text = date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
      return text + ' ' + t(WEEKDAY_KEYS[date.getDay()]);
    }

    /** The heading of a date group: short, and relative for the last two days. */
    function groupLabel(key, t) {
      const today = todayKey();
      if (key === today) return t('labelToday');
      if (key === shiftDay(today, -1)) return t('labelYesterday');
      const date = new Date(key + 'T00:00:00');
      if (Number.isNaN(date.getTime())) return key;
      const text = key.slice(0, 4) === today.slice(0, 4) ? key.slice(5) : key;
      return text + ' ' + t(WEEKDAY_KEYS[date.getDay()]);
    }

    function weekdayOf(key, t) {
      const date = new Date(key + 'T00:00:00');
      return Number.isNaN(date.getTime()) ? '' : t(WEEKDAY_KEYS[date.getDay()]);
    }

    /* --------------------------------------------------------------- glyphs -- */

    function TilePlannedGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', focusable: 'false' },
        stroke('M3.6 7.4h8.8M3.6 10.6h5.6M3.6 4.2h8.8', 1.5));
    }

    function TileDoneGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', focusable: 'false' },
        stroke('M3.2 8.4l3.1 3.1 6.5-7.2', 1.8));
    }

    function TileOpenGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', focusable: 'false' },
        stroke('M8 4.4v4l2.8 1.7', 1.5),
        h('circle', { cx: 8, cy: 8, r: 6.1, fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 }));
    }

    function TileRateGlyph() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', focusable: 'false' },
        stroke('M3.4 12.4l2.8-3.6 2.4 2.2 4-5.4', 1.6));
    }

    /** Shown where a list has nothing to show. */
    function EmptyGlyph() {
      return h('svg', { viewBox: '0 0 48 48', width: 60, height: 60, 'aria-hidden': 'true', focusable: 'false' },
        h('rect', {
          x: 9, y: 12, width: 30, height: 24, rx: 6,
          fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
        }),
        stroke('M16 21h11M16 27h7', 1.6));
    }

    /* --------------------------------------------------------------- stats -- */

    /** Today's numbers, plus the backlog: everything logged on or before today and still open. */
    function todayStatsOf(items, day) {
      let planned = 0;
      let completed = 0;
      let open = 0;
      for (const item of items) {
        if (item.day === day) planned += 1;
        if (item.completedAt !== null && dayKeyOf(item.completedAt) === day) completed += 1;
        if (!item.done && item.day <= day) open += 1;
      }
      return { planned, completed, open };
    }

    /** One day's lists, for the summary card. */
    function dayViewOf(items, day) {
      const logged = [];
      const open = [];
      const done = [];
      for (const item of items) {
        const completedDay = item.completedAt === null ? null : dayKeyOf(item.completedAt);
        const loggedThatDay = item.day === day;
        const completedThatDay = completedDay === day;
        if (loggedThatDay) logged.push(item);
        if (!item.done && item.day <= day) open.push(item);
        else if (item.done && (completedThatDay || loggedThatDay)) done.push(item);
      }
      const byCreated = (left, right) => (
        left.createdAt === right.createdAt
          ? (left.id < right.id ? -1 : 1)
          : left.createdAt - right.createdAt
      );
      open.sort(byCreated);
      logged.sort(byCreated);
      done.sort((left, right) => (
        (right.completedAt === null ? 0 : right.completedAt) - (left.completedAt === null ? 0 : left.completedAt)
      ));
      return { logged, open, done };
    }

    /** Seven days ending at `day`, oldest first. */
    function weekOf(items, day) {
      const days = [];
      for (let offset = -6; offset <= 0; offset += 1) {
        const key = shiftDay(day, offset);
        let planned = 0;
        let completed = 0;
        for (const item of items) {
          if (item.day === key) planned += 1;
          if (item.completedAt !== null && dayKeyOf(item.completedAt) === key) completed += 1;
        }
        days.push({ key, planned, completed, label: key.slice(5) });
      }
      return days;
    }

    /** Tags of one day's two lists, most used first. */
    function dayTagStats(view) {
      const map = new Map();
      const collect = (list, field) => {
        for (const item of list) {
          for (const tag of item.tags) {
            const key = tagKey(tag);
            let found = map.get(key);
            if (found === undefined) {
              found = { key, name: tag, open: 0, done: 0 };
              map.set(key, found);
            }
            found[field] += 1;
          }
        }
      };
      collect(view.open, 'open');
      collect(view.done, 'done');
      return Array.from(map.values())
        .map((tag) => ({ ...tag, count: tag.open + tag.done }))
        .sort((left, right) => (
          right.count - left.count || (left.name < right.name ? -1 : 1)
        ));
    }

    /** One group per day, newest first; the rows inside keep the list's own order. */
    function groupByDay(list, byCompletion) {
      const map = new Map();
      for (const item of list) {
        const bucket = map.get(item.day);
        if (bucket === undefined) map.set(item.day, [item]);
        else bucket.push(item);
      }
      const groups = [];
      for (const key of Array.from(map.keys()).sort((left, right) => (left < right ? 1 : -1))) {
        const bucket = map.get(key);
        bucket.sort((left, right) => {
          if (byCompletion) {
            const l = left.completedAt === null ? 0 : left.completedAt;
            const r = right.completedAt === null ? 0 : right.completedAt;
            if (l !== r) return r - l;
          }
          return left.createdAt === right.createdAt
            ? (left.id < right.id ? -1 : 1)
            : left.createdAt - right.createdAt;
        });
        groups.push({ key, list: bucket });
      }
      return groups;
    }

    /**
     * The day's unfinished work that already reports a progress value: the list
     * a daily report needs, most advanced first.
     */
    function inProgressOf(view) {
      const seen = new Set();
      const list = [];
      const consider = (item) => {
        if (item.progress === null || item.progress >= 100) return;
        if (seen.has(item.id)) return;
        seen.add(item.id);
        list.push(item);
      };
      for (const item of view.open) consider(item);
      for (const item of view.logged) consider(item);
      list.sort((left, right) => right.progress - left.progress || left.createdAt - right.createdAt);
      return list;
    }

    /** The automatic summary text: the user may rewrite it and save it as is. */
    function summaryOf(day, view, tags, t) {
      const lines = [t('summaryHead', {
        day: dayLabel(day, t),
        planned: view.logged.length,
        done: view.done.length,
        open: view.open.length,
      })];
      if (view.done.length > 0) {
        lines.push('');
        lines.push(t('summaryDoneHeading') + '（' + view.done.length + '）');
        for (const item of view.done) {
          lines.push('- ' + (item.completedAt === null ? '' : clockOf(item.completedAt) + ' ') + firstLine(item.text));
        }
      }
      // In-flight work gets its own block, and leaves the "still open" list:
      // the report reads done / in progress / not started, with no repeats.
      const running = inProgressOf(view);
      if (running.length > 0) {
        lines.push('');
        lines.push(t('summaryProgressHeading') + '（' + running.length + '）');
        for (const item of running) {
          const gap = daysBetween(item.day, day);
          lines.push('- ' + item.progress + '% ' + firstLine(item.text) + (gap > 0 ? '（' + gap + ' 天）' : ''));
        }
      }
      const runningIds = new Set(running.map((item) => item.id));
      const notStarted = view.open.filter((item) => !runningIds.has(item.id));
      if (notStarted.length > 0) {
        lines.push('');
        lines.push(t('summaryOpenHeading') + '（' + notStarted.length + '）');
        for (const item of notStarted) {
          const gap = daysBetween(item.day, day);
          lines.push('- ' + firstLine(item.text) + (gap > 0 ? '（' + gap + ' 天）' : ''));
        }
      }
      if (tags.length > 0) {
        lines.push('');
        lines.push(t('summaryTagsHeading') + '：'
          + tags.slice(0, 8).map((tag) => tag.name + ' ' + tag.count).join(' · '));
      }
      return lines.join('\n');
    }

    /** One prompt that hands the day's record to the agent in the conversation. */
    function agentPromptOf(day, view, t) {
      const lines = [t('agentPromptHead', { day: dayLabel(day, t) }), ''];
      if (view.logged.length > 0) {
        lines.push(t('agentPromptPlanned'));
        for (const item of view.logged) lines.push('- ' + firstLine(item.text));
        lines.push('');
      }
      if (view.done.length > 0) {
        lines.push(t('agentPromptDone'));
        for (const item of view.done) {
          lines.push('- ' + (item.completedAt === null ? '' : clockOf(item.completedAt) + ' ') + firstLine(item.text));
        }
        lines.push('');
      }
      const running = inProgressOf(view);
      if (running.length > 0) {
        lines.push(t('agentPromptProgress'));
        for (const item of running) {
          lines.push('- ' + item.progress + '% ' + firstLine(item.text));
        }
        lines.push('');
      }
      const runningIds = new Set(running.map((item) => item.id));
      const notStarted = view.open.filter((item) => !runningIds.has(item.id));
      if (notStarted.length > 0) {
        lines.push(t('agentPromptOpen'));
        for (const item of notStarted) lines.push('- ' + firstLine(item.text));
      }
      return lines.join('\n');
    }

    /**
     * Page themes. Each one is a small set of core colours plus a decoration
     * flag; the CSS turns those cores into the host tokens the page uses, scoped
     * to the page root, so a theme never leaks into the rest of the app.
     */
    const THEME_KEY = 'dsh.todo-notes.theme';
    const LEGACY_TECH_KEY = 'dsh.todo-notes.tech';
    const THEMES = ['tech', 'paper', 'celadon', 'mist', 'contrast', 'plain'];
    const DEFAULT_THEME = 'tech';

    function readTheme() {
      try {
        const stored = window.localStorage.getItem(THEME_KEY);
        if (typeof stored === 'string' && THEMES.includes(stored)) return stored;
        // Before themes existed there was a single tech switch; honour it once.
        if (window.localStorage.getItem(LEGACY_TECH_KEY) === 'off') return 'plain';
      } catch (error) {
        return DEFAULT_THEME;
      }
      return DEFAULT_THEME;
    }

    function writeTheme(id) {
      try {
        window.localStorage.setItem(THEME_KEY, id);
      } catch (error) {
        // The theme still applies for this session.
      }
    }

    /**
     * Whether the app is currently painting light or dark.
     *
     * The page needs to know because a theme carries one core set per scheme,
     * and the app resolves light/dark itself. A probe element is painted with a
     * host token and read back, which works whatever sets the scheme (the
     * appearance setting, the system, or a skin) and needs no host cooperation.
     */
    function readScheme() {
      try {
        const probe = document.createElement('span');
        probe.setAttribute('aria-hidden', 'true');
        probe.style.cssText = 'position:absolute;left:-9999px;top:0;width:0;height:0;'
          + 'color:var(--dsw-alias-label-primary)';
        document.body.appendChild(probe);
        const painted = window.getComputedStyle(probe).color;
        probe.remove();
        const parts = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(painted);
        if (parts === null) return 'light';
        const channel = (value) => {
          const unit = Number(value) / 255;
          return unit <= 0.03928 ? unit / 12.92 : Math.pow((unit + 0.055) / 1.055, 2.4);
        };
        const luminance = 0.2126 * channel(parts[1]) + 0.7152 * channel(parts[2]) + 0.0722 * channel(parts[3]);
        // Primary label text is light in dark mode and dark in light mode.
        return luminance > 0.5 ? 'dark' : 'light';
      } catch (error) {
        return 'light';
      }
    }

    /** Re-read the scheme when the app repaints, the system flips, or a skin is applied. */
    function watchScheme(onChange) {
      const report = () => { onChange(readScheme()); };
      const observer = new MutationObserver(report);
      observer.observe(document.documentElement, { attributes: true });
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      if (typeof media.addEventListener === 'function') media.addEventListener('change', report);
      return () => {
        observer.disconnect();
        if (typeof media.removeEventListener === 'function') media.removeEventListener('change', report);
      };
    }

    /* ---------------------------------------------------------- the month -- */
    /** Short weekday headings, Monday first. */
    const WEEK_SHORT_KEYS = [
      'weekShortMon', 'weekShortTue', 'weekShortWed', 'weekShortThu',
      'weekShortFri', 'weekShortSat', 'weekShortSun',
    ];

    /** The first day of the month a key belongs to. */
    function monthStartOf(key) {
      return key.slice(0, 8) + '01';
    }

    /** The 42 grid days (six weeks, Monday first) that cover one month. */
    function monthGridDays(anchor) {
      const date = new Date(anchor + 'T00:00:00');
      if (Number.isNaN(date.getTime())) return [];
      const offset = (date.getDay() + 6) % 7;
      const start = shiftDay(anchor, -offset);
      const days = [];
      for (let index = 0; index < 42; index += 1) days.push(shiftDay(start, index));
      return days;
    }

    /** One pass over every entry, split by the day it belongs to and the day it was finished. */
    function dayBuckets(items) {
      const map = new Map();
      const bucketOf = (key) => {
        let bucket = map.get(key);
        if (bucket === undefined) {
          bucket = { logged: [], done: [] };
          map.set(key, bucket);
        }
        return bucket;
      };
      for (const item of items) {
        bucketOf(item.day).logged.push(item);
        if (item.completedAt !== null) bucketOf(dayKeyOf(item.completedAt)).done.push(item);
      }
      for (const bucket of map.values()) {
        bucket.logged.sort((left, right) => left.createdAt - right.createdAt);
        bucket.done.sort((left, right) => (
          (right.completedAt === null ? 0 : right.completedAt) - (left.completedAt === null ? 0 : left.completedAt)
        ));
      }
      return map;
    }

    /* -------------------------------------------------------------- the row -- */

    /**
     * Card text. A task link often *is* the entry (that is how Projex links get
     * logged), so a leading address renders as a real link instead of dead text;
     * everything after it is left exactly as typed.
     */
    function noteTitleNodes(item) {
      const match = /^(https?:\/\/\S+)([\s\S]*)$/.exec(item.text);
      if (match === null) return item.text;
      return [
        h('a', {
          key: 'url',
          className: 'dtn-note-textlink',
          href: match[1],
          target: '_blank',
          rel: 'noreferrer noopener',
          title: match[1],
        }, match[1]),
        match[2],
      ];
    }

    /**
     * Inline editor for one progress note.
     *
     * Notes show up in two places — the timeline on the card and the list in the
     * entry editor — so both use this box: a note is rewritten the same way
     * wherever it appears. It owns its own draft text, so the parent only has to
     * remember *which* note is being edited.
     */
    function LogEditBox({ t, text, onSave, onCancel }) {
      const [value, setValue] = useState(text);
      const boxRef = useRef(null);

      useEffect(() => {
        const node = boxRef.current;
        if (node !== null && typeof node.focus === 'function') node.focus();
      }, []);

      const save = () => {
        const trimmed = value.trim();
        // Emptying a note is not a rewrite; treat it as leaving it alone.
        if (trimmed === '') {
          onCancel();
          return;
        }
        onSave(trimmed);
      };

      return h('div', { className: 'dtn-log-edit' }, [
        h('textarea', {
          key: 'input',
          ref: boxRef,
          className: 'dtn-inline-input dtn-log-edit-input',
          rows: 2,
          value,
          'aria-label': t('logEdit'),
          onChange: (event) => { setValue(event.target.value); },
          onKeyDown: (event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              save();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          },
        }),
        h('div', { key: 'actions', className: 'dtn-log-edit-actions' }, [
          h('button', {
            key: 'save',
            type: 'button',
            className: 'dtn-btn is-primary is-quiet',
            onClick: save,
          }, t('save')),
          h('button', {
            key: 'cancel',
            type: 'button',
            className: 'dtn-btn is-quiet',
            onClick: onCancel,
          }, t('cancel')),
        ]),
      ]);
    }

    /**
     * One entry as a sticky note: a paper-coloured card with the entry's own
     * colour, a slight tilt on the wall, its links, its progress trail, and its
     * sub-entries nested inside it.
     *
     * Nothing edits in place here: the buttons hand the entry to the one editor
     * panel above the wall, so a column never reflows while typing.
     */
    function NoteCard({ api, item, childIds, isChild, tilt }) {
      const t = api.t;
      const children = (api.childrenMap.get(item.id) || []).filter((child) => (
        child.done === item.done
        && (childIds === undefined || childIds === null || childIds.has(child.id))
      ));
      const expanded = !item.collapsed;
      const editing = api.editingItemId === item.id;
      const confirming = api.confirmingId === item.id;
      const carried = item.done ? 0 : daysBetween(item.day, api.today);
      const age = daysBetween(dayKeyOf(item.createdAt), api.today);
      const backfilled = item.day !== dayKeyOf(item.createdAt);
      // A note or a link is added right on the card: one inline draft at a time,
      // so the full editor stays reserved for actually editing the entry.
      const [draft, setDraft] = useState(null);
      const [draftText, setDraftText] = useState('');
      const [draftError, setDraftError] = useState(null);
      // The index of the note being rewritten, if any: one inline editor at a time.
      const [editingLog, setEditingLog] = useState(null);

      const openDraft = (kind) => {
        setDraft(draft === kind ? null : kind);
        setDraftText('');
        setDraftError(null);
        setEditingLog(null);
      };

      const saveLogEdit = (index, text) => {
        if (api.updateLog(item.id, index, text) === false) return;
        setEditingLog(null);
      };

      const closeDraft = () => {
        setDraft(null);
        setDraftText('');
        setDraftError(null);
      };

      const submitLog = () => {
        const value = draftText.trim();
        if (value === '') return;
        api.addLog(item.id, value);
        closeDraft();
      };

      const submitLink = () => {
        // The field takes a whole pasted "address + title" line; the parser
        // splits it, so one field is enough here.
        if (api.addLink(item.id, draftText, '')) {
          closeDraft();
          return;
        }
        setDraftError(t('linkInvalid'));
      };

      /** The small form the card grows for one note or one link. */
      const draftForm = (kind) => h('div', { key: 'draft', className: 'dtn-inline-add' }, [
        kind === 'log'
          ? h('textarea', {
            key: 'input',
            className: 'dtn-inline-input',
            rows: 2,
            value: draftText,
            placeholder: t('logPlaceholder'),
            'aria-label': t('logsLabel'),
            autoFocus: true,
            onChange: (event) => { setDraftText(event.target.value); },
            onKeyDown: (event) => {
              if (event.key === 'Enter' && event.shiftKey === false) {
                event.preventDefault();
                submitLog();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                closeDraft();
              }
            },
          })
          : h('input', {
            key: 'input',
            className: 'dtn-inline-input',
            type: 'text',
            value: draftText,
            placeholder: t('linkUrl'),
            'aria-label': t('linkUrl'),
            autoFocus: true,
            onChange: (event) => { setDraftText(event.target.value); },
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitLink();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                closeDraft();
              }
            },
          }),
        h('div', { key: 'actions', className: 'dtn-inline-actions' }, [
          h('button', {
            key: 'save',
            type: 'button',
            className: 'dtn-btn is-primary is-quiet',
            onClick: kind === 'log' ? submitLog : submitLink,
          }, kind === 'log' ? t('logAdd') : t('linkAdd')),
          h('button', {
            key: 'cancel',
            type: 'button',
            className: 'dtn-btn is-quiet',
            onClick: closeDraft,
          }, t('cancel')),
        ]),
        kind === 'link' && draftError !== null
          ? h('p', { key: 'error', className: 'dtn-status is-error' }, draftError)
          : null,
      ]);

      const head = [
        h('button', {
          key: 'check',
          type: 'button',
          role: 'checkbox',
          'aria-checked': item.done,
          className: 'dtn-check' + (item.done ? ' is-on' : ''),
          title: item.done ? t('markActive') : t('markDone'),
          'aria-label': item.done ? t('markActive') : t('markDone'),
          onClick: () => { api.toggleDone(item.id); },
        }, item.done ? h(CheckGlyph, { size: 10 }) : null),
        h('span', { key: 'text', className: 'dtn-note-text' }, noteTitleNodes(item)),
        h('span', { key: 'actions', className: 'dtn-note-actions' }, [
          h('button', {
            key: 'log',
            type: 'button',
            className: 'dtn-note-quick' + (draft === 'log' ? ' is-on' : ''),
            'aria-expanded': draft === 'log',
            title: t('logAdd'),
            onClick: () => { openDraft('log'); },
          }, '+', t('logsLabel')),
          h('button', {
            key: 'link',
            type: 'button',
            className: 'dtn-note-quick' + (draft === 'link' ? ' is-on' : ''),
            'aria-expanded': draft === 'link',
            title: t('linkAdd'),
            onClick: () => { openDraft('link'); },
          }, '+', t('linksLabel')),
          h(IconButton, {
            key: 'add',
            label: t('addChild'),
            glyph: h(PlusGlyph, null),
            onClick: () => { api.openChild(item.id); },
          }),
          h(IconButton, {
            key: 'edit',
            label: t('edit'),
            glyph: h(PencilGlyph, null),
            expanded: editing,
            onClick: () => { api.openEditor(item.id, 'text'); },
          }),
          h(IconButton, {
            key: 'delete',
            label: t('delete'),
            glyph: h(TrashGlyph, null),
            danger: true,
            expanded: confirming,
            onClick: () => {
              api.setConfirmingId(confirming ? null : item.id);
              api.closeEditor();
            },
          }),
        ]),
      ];

      const meta = [];
      if (children.length > 0) {
        meta.push(h('button', {
          key: 'caret',
          type: 'button',
          className: 'dtn-note-caret',
          title: expanded ? t('collapse') : t('expand'),
          'aria-label': expanded ? t('collapse') : t('expand'),
          'aria-expanded': expanded,
          onClick: () => { api.toggleCollapse(item.id); },
        }, h(CaretGlyph, { open: expanded }), h('span', { key: 'n' }, String(children.length))));
      }
      meta.push(h('span', {
        key: 'age',
        className: 'dtn-note-note',
        title: t('ageTitle', { day: dayKeyOf(item.createdAt) }),
      }, age <= 0 ? t('ageToday') : t('ageDays', { days: age })));
      if (item.done && item.completedAt !== null) {
        meta.push(h('span', { key: 'time', className: 'dtn-note-note' },
          t('doneAt', { time: clockOf(item.completedAt) })));
      }
      if (carried > 0) {
        meta.push(h('button', {
          key: 'move',
          type: 'button',
          className: 'dtn-note-note is-warn',
          title: t('moveToToday'),
          onClick: () => { api.moveToDay(item.id, api.today); },
        }, t('carriedBadge', { days: carried })));
      }
      if (backfilled) {
        meta.push(h('span', { key: 'backfill', className: 'dtn-note-note' }, t('backfillBadge')));
      }
      if (item.progress !== null) {
        meta.push(h('span', {
          key: 'progress',
          className: 'dtn-note-pct' + (item.progress >= 100 ? ' is-done' : ' is-open'),
          title: item.progress >= 100 ? t('markActive') : t('progressInProgress'),
        }, t('progressAt', { percent: item.progress })));
      }
      if (isChild === true) {
        meta.push(h('span', { key: 'child', className: 'dtn-note-note' }, '↳'));
      }

      const foot = [];
      for (const tag of item.tags) {
        foot.push(h('button', {
          key: 'tag:' + tagKey(tag),
          type: 'button',
          className: 'dtn-tag'
            + (typeof api.tagFilter === 'string' && tagKey(api.tagFilter) === tagKey(tag) ? ' is-on' : ''),
          style: tagStyle(tag, typeof api.tagFilter === 'string' && tagKey(api.tagFilter) === tagKey(tag)),
          title: t('tagFilterLabel'),
          onClick: () => { api.toggleTagFilter(tag); },
        }, tag));
      }
      for (const link of item.links) {
        foot.push(h('a', {
          key: 'link:' + link.url,
          className: 'dtn-note-link',
          href: link.url,
          target: '_blank',
          rel: 'noreferrer noopener',
          title: link.url,
        }, link.title === '' ? hostOf(link.url) : link.title));
      }
      if (item.refs.length > 0) foot.push(h(RefRow, { key: 'refs', api, item }));

      // The progress trail is a compact timeline: time on the left, a rail with
      // a small dot per entry, the note itself beside it. The newest entry is
      // marked by a filled dot and stronger text rather than by extra words.
      // Its own inline draft appears here when a note is being added.
      // Each shown note keeps its index in `item.logs`, because the display
      // order is reversed and editing has to address the stored note.
      const recentLogs = item.logs
        .map((log, index) => ({ log, index }))
        .slice(-3)
        .reverse();
      const trail = item.logs.length === 0 && draft !== 'log'
        ? null
        : h('section', { key: 'trail', className: 'dtn-trail' }, [
          h('div', { key: 'head', className: 'dtn-trail-head' }, [
            h('span', { key: 'label', className: 'dtn-trail-label' }, t('logsLabel')),
            h('span', { key: 'count', className: 'dtn-trail-count' }, String(item.logs.length)),
            h('button', {
              key: 'add',
              type: 'button',
              className: 'dtn-trail-add' + (draft === 'log' ? ' is-on' : ''),
              title: t('logAdd'),
              'aria-label': t('logAdd'),
              'aria-expanded': draft === 'log',
              onClick: () => { openDraft('log'); },
            }, '＋'),
          ]),
          item.logs.length === 0 ? null : h('ol', { key: 'list', className: 'dtn-trail-list' },
            recentLogs.map((entry) => h('li', {
              key: 'log:' + entry.index,
              className: 'dtn-trail-item' + (entry.index === item.logs.length - 1 ? ' is-latest' : ''),
            }, [
              h('span', {
                key: 'time',
                className: 'dtn-trail-time',
                title: entry.index === item.logs.length - 1 ? t('logLatest') : '',
              }, entry.log.at === null ? '' : clockOf(entry.log.at)),
              h('span', { key: 'body', className: 'dtn-trail-body' }, [
                h('span', { key: 'dot', className: 'dtn-trail-dot', 'aria-hidden': 'true' }),
                editingLog === entry.index
                  ? h(LogEditBox, {
                    key: 'edit',
                    t,
                    text: entry.log.text,
                    onSave: (text) => { saveLogEdit(entry.index, text); },
                    onCancel: () => { setEditingLog(null); },
                  })
                  : h('span', { key: 'text', className: 'dtn-trail-text' }, entry.log.text),
                editingLog === entry.index
                  ? null
                  : h('button', {
                    key: 'edit',
                    type: 'button',
                    className: 'dtn-log-edit-open',
                    title: t('logEdit'),
                    'aria-label': t('logEdit'),
                    onClick: () => {
                      setDraft(null);
                      setEditingLog(entry.index);
                    },
                  }, '✎'),
              ]),
            ]))),
          draft === 'log'
            ? draftForm('log')
            : (item.logs.length > 3
              ? h('button', {
                key: 'more',
                type: 'button',
                className: 'dtn-trail-more',
                onClick: () => { api.openEditor(item.id, 'log'); },
              }, t('moreLogs', { count: item.logs.length - 3 }))
              : null),
        ]);

      const blocks = [h('article', {
        key: 'note',
        className: 'dtn-note'
          + (item.done ? ' is-done' : '')
          + (carried > 0 ? ' is-overdue' : '')
          + (editing ? ' is-editing' : '')
          + (isChild === true ? ' is-child' : ''),
        style: { '--dtn-note-accent': item.color },
      }, [
        h('div', { key: 'head', className: 'dtn-note-head' }, head),
        h('div', { key: 'meta', className: 'dtn-note-meta' }, meta),
        // Below 100% the bar carries the accent colour; a finished entry turns
        // it green, so "in progress" reads at a glance.
        item.progress === null ? null : h('span', {
          key: 'bar',
          className: 'dtn-note-progress',
          role: 'progressbar',
          'aria-valuenow': item.progress,
          'aria-valuemin': 0,
          'aria-valuemax': 100,
        }, h('span', {
          className: 'dtn-note-progress-fill' + (item.progress >= 100 ? ' is-done' : ''),
          style: { width: item.progress + '%' },
        })),
        // Footnotes read in one order: tags and links first, then the progress
        // trail at the very bottom, where a growing history belongs. A link
        // being added shows its own small form at the foot.
        foot.length === 0 && draft !== 'link'
          ? null
          : h('div', { key: 'foot', className: 'dtn-note-foot' }, [
            ...foot,
            draft === 'link' ? draftForm('link') : null,
          ]),
        trail,
        confirming ? h('div', { key: 'confirm' }, h(ConfirmBar, { api, item })) : null,
        expanded && children.length > 0
          ? h('div', { key: 'kids', className: 'dtn-note-kids' },
            children.map((child, index) => h(NoteCard, {
              key: child.id,
              api,
              item: child,
              childIds,
              isChild: true,
              tilt: index % 3 - 1,
            })))
          : null,
      ])];

      return h(React.Fragment, null, blocks);
    }

    /**
     * The one editor surface for an entry: it opens full width above the wall
     * with every field in one place, so nothing is edited inside a column.
     */
    function EditorPanel({ api, target, focus, advanced }) {
      const t = api.t;
      const isEdit = target.mode === 'edit';
      const item = isEdit ? target.item : null;
      const parent = isEdit ? null : target.parent;
      const [text, setText] = useState(isEdit ? item.text : '');
      const [tags, setTags] = useState(isEdit ? item.tags : []);
      const [tagText, setTagText] = useState('');
      const [day, setDay] = useState(isEdit ? item.day : target.parentDay);
      const [done, setDone] = useState(isEdit ? item.done : false);
      const [progressOn, setProgressOn] = useState(isEdit && item.progress !== null);
      const [progress, setProgress] = useState(isEdit && item.progress !== null ? item.progress : 0);
      const [linkUrl, setLinkUrl] = useState('');
      const [linkTitle, setLinkTitle] = useState('');
      const [linkError, setLinkError] = useState(null);
      const [logText, setLogText] = useState('');
      // The index of the note being rewritten, if any: one inline editor at a time.
      const [editingLog, setEditingLog] = useState(null);
      // While creating, links and notes are held here and attached on save.
      const [pendingLinks, setPendingLinks] = useState([]);
      const [pendingLogs, setPendingLogs] = useState([]);
      const textRef = useRef(null);
      const logRef = useRef(null);
      const linkRef = useRef(null);

      useEffect(() => {
        const node = focus === 'log' ? logRef.current : (focus === 'link' ? linkRef.current : textRef.current);
        if (node !== null && node !== undefined && typeof node.focus === 'function') node.focus();
      }, [focus]);

      const saveLogEdit = (index, text) => {
        if (item === null || api.updateLog(item.id, index, text) === false) return;
        setEditingLog(null);
      };

      const close = () => { api.closeEditor(); };

      const commit = () => {
        const value = text.trim();
        if (value === '') {
          const node = textRef.current;
          if (node !== null && typeof node.focus === 'function') node.focus();
          return;
        }
        const finalTags = mergeTags(tags, parseTagText(tagText));
        const nextProgress = progressOn ? progress : null;
        if (isEdit) {
          const changedProgress = nextProgress !== item.progress;
          // Progress owns the completion state when it changes; otherwise the
          // checkbox in this panel does.
          api.updateItem(
            item.id,
            { text: value, color: item.color, tags: finalTags, day },
            done !== item.done && !changedProgress,
            done,
          );
          if (changedProgress) api.setProgress(item.id, nextProgress);
          close();
          return;
        }
        const finished = done || (nextProgress === 100);
        const created = api.createItem({
          text: value,
          color: api.nextColor(),
          tags: finalTags,
          done: finished,
          day,
          progress: nextProgress,
          links: pendingLinks,
          logs: pendingLogs,
          parentId: parent === undefined || parent === null ? null : parent.id,
        }, parent === undefined || parent === null ? null : parent.id);
        if (created !== undefined && created !== null) close();
      };

      const toggleTag = (name) => {
        setTags((previous) => (
          previous.some((tag) => tagKey(tag) === tagKey(name))
            ? previous.filter((tag) => tagKey(tag) !== tagKey(name))
            : normalizeTags(previous.concat([name]))
        ));
      };

      const addTypedTags = () => {
        const parsed = parseTagText(tagText);
        if (parsed.length === 0) return;
        setTags((previous) => mergeTags(previous, parsed));
        setTagText('');
      };

      const addLink = () => {
        const parsed = parseLinkInput(linkUrl === '' ? linkTitle : linkUrl);
        if (parsed === null) {
          setLinkError(t('linkInvalid'));
          return;
        }
        const title = linkTitle.trim() === '' ? parsed.title : linkTitle.trim();
        if (item === null) {
          setPendingLinks((previous) => previous
            .filter((entry) => entry.url !== parsed.url)
            .concat([{ url: parsed.url, title }]));
          setLinkUrl('');
          setLinkTitle('');
          setLinkError(null);
          return;
        }
        if (api.addLink(item.id, parsed.url, title)) {
          setLinkUrl('');
          setLinkTitle('');
          setLinkError(null);
        } else {
          setLinkError(t('linkInvalid'));
        }
      };

      const addLog = () => {
        const value = logText.trim();
        if (value === '') return;
        if (item === null) {
          setPendingLogs((previous) => previous.concat([{ text: value, at: Date.now() }]));
          setLogText('');
          return;
        }
        if (api.addLog(item.id, logText)) setLogText('');
      };

      const rows = [];

      rows.push(h('div', { key: 'text', className: 'dtn-panel-row' }, [
        h('textarea', {
          key: 'input',
          ref: textRef,
          className: 'dtn-panel-text',
          rows: 2,
          value: text,
          placeholder: t('placeholderEdit'),
          'aria-label': isEdit ? t('editorEdit') : t('editorCreate'),
          onChange: (event) => { setText(event.target.value); },
          onKeyDown: (event) => {
            if (event.key === 'Enter' && event.shiftKey === false) {
              event.preventDefault();
              commit();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
          },
        }),
      ]));

      // Progressive disclosure: a new entry opens with its title and its links
      // only; tags, progress and the notes trail wait behind 更多. An existing
      // entry shows everything, because that is the point of editing it.
      const showExtras = isEdit === true || advanced === true;
      if (showExtras) {
        rows.push(h('div', { key: 'tags', className: 'dtn-tags' }, [
          h('span', { key: 'label', className: 'dtn-foot-note' }, t('tagsLabel')),
          ...api.tagOptions.slice(0, 8).map((option) => {
          const chosen = tags.some((tag) => tagKey(tag) === option.key);
          return h('button', {
            key: 'option:' + option.key,
            type: 'button',
            className: 'dtn-tag' + (chosen ? ' is-on' : ''),
            style: tagStyle(option.name, chosen),
            title: t('tagSuggest'),
            onClick: () => { toggleTag(option.name); },
          }, option.name + ' ' + option.count);
        }),
        h('input', {
          key: 'input',
          className: 'dtn-tag-input',
          type: 'text',
          value: tagText,
          placeholder: t('tagPlaceholder'),
          'aria-label': t('tagPlaceholder'),
          onChange: (event) => { setTagText(event.target.value); },
          onKeyDown: (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addTypedTags();
            }
          },
          onBlur: addTypedTags,
        }),
        ...tags
          .filter((tag) => !api.tagOptions.some((option) => option.key === tagKey(tag)))
          .map((tag) => h('span', {
            key: 'new:' + tagKey(tag),
            className: 'dtn-tag is-on',
            style: tagStyle(tag, true),
          }, tag)),
      ]));

        rows.push(h('div', { key: 'progress', className: 'dtn-panel-row' }, [
        h('label', { key: 'on', className: 'dtn-check-line' }, [
          h('input', {
            key: 'cb',
            className: 'dtn-cb',
            type: 'checkbox',
            checked: progressOn,
            onChange: (event) => {
              const on = event.target.checked;
              setProgressOn(on);
              // A fresh switch on starts somewhere useful instead of at zero.
              if (on && progress === 0) setProgress(50);
            },
          }),
          h('span', { key: 'label' }, t('progressSet')),
        ]),
        progressOn !== true ? null : h('input', {
          key: 'range',
          className: 'dtn-range',
          type: 'range',
          min: 0,
          max: 100,
          step: 5,
          value: progress,
          'aria-label': t('progressLabel'),
          onChange: (event) => { setProgress(Number(event.target.value)); },
        }),
        progressOn !== true ? null : h('span', {
          key: 'value',
          className: 'dtn-note-pct' + (progress >= 100 ? ' is-done' : ' is-open'),
        }, t('progressAt', { percent: progress })),
        progressOn !== true ? null : h('button', {
          key: 'clear',
          type: 'button',
          className: 'dtn-btn is-quiet',
          onClick: () => {
            setProgressOn(false);
            setProgress(0);
          },
        }, t('progressClear')),
      ]));
      }

      /**
       * Links and progress notes exist for both modes: an existing entry edits
       * them live, while a new one queues them and the save attaches them — so
       * creating an entry with its link is one action, not two.
       */
      const viewLinks = item === null
        ? pendingLinks.map((entry) => ({
          url: entry.url,
          title: entry.title,
          remove: () => {
            setPendingLinks((previous) => previous.filter((candidate) => candidate.url !== entry.url));
          },
        }))
        : item.links.map((entry, index) => ({
          url: entry.url,
          title: entry.title,
          remove: () => { api.removeLink(item.id, index); },
        }));
      const viewLogs = item === null
        ? pendingLogs.map((entry, index) => ({
          text: entry.text,
          at: entry.at,
          index,
          remove: () => {
            setPendingLogs((previous) => previous.filter((candidate, position) => position !== index));
          },
        }))
        : item.logs.map((entry, index) => ({
          text: entry.text,
          at: entry.at,
          index,
          remove: () => { api.removeLog(item.id, index); },
        }));

      // With nothing attached yet, the link row stands alone: a heading over an
      // empty list is just noise the user has to read past.
      const linkRow = h('div', { key: 'add', className: 'dtn-panel-row' }, [
        h('input', {
          key: 'url',
          ref: linkRef,
          className: 'dtn-field',
          type: 'text',
          value: linkUrl,
          placeholder: t('linkUrl'),
          'aria-label': t('linkUrl'),
          onChange: (event) => { setLinkUrl(event.target.value); },
          onKeyDown: (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addLink();
            }
          },
        }),
        // Only the address is asked for up front; a pasted "link + title" line
        // already carries its title, so the title field waits for 更多.
        h('input', {
          key: 'title',
          className: 'dtn-field',
          type: 'text',
          value: linkTitle,
          placeholder: t('linkTitle'),
          'aria-label': t('linkTitle'),
          onChange: (event) => { setLinkTitle(event.target.value); },
          style: {
            display: isEdit === true || advanced === true ? undefined : 'none',
          },
        }),
        h('button', { key: 'add', type: 'button', className: 'dtn-btn', onClick: addLink }, t('linkAdd')),
      ]);
      const linkChips = viewLinks.map((link) => h('span', {
        key: 'link:' + link.url,
        className: 'dtn-note-link',
      }, [
        h('span', { key: 'text', className: 'dtn-link-text', title: link.url },
          link.title === '' ? hostOf(link.url) : link.title),
        h('button', {
          key: 'drop',
          type: 'button',
          className: 'dtn-ref-drop',
          title: t('removeLink'),
          'aria-label': t('removeLink'),
          onClick: link.remove,
        }, '×'),
      ]));
      if (viewLinks.length === 0) {
        rows.push(h('div', { key: 'links', className: 'dtn-panel-row' }, [linkRow]));
      } else {
        rows.push(h('div', { key: 'links', className: 'dtn-panel-block' }, [
          h('div', { key: 'head', className: 'dtn-panel-head' }, [
            h('span', { key: 'title', className: 'dtn-card-title' }, t('linksLabel')),
            h('span', { key: 'count', className: 'dtn-foot-note' }, String(viewLinks.length)),
          ]),
          h('div', { key: 'list', className: 'dtn-tags' }, linkChips),
          linkRow,
        ]));
      }
      if (linkError !== null) {
        rows.push(h('p', { key: 'linkError', className: 'dtn-status is-error' }, linkError));
      }

      // A progress trail only makes sense on an entry that has a history.
      if (isEdit === true) {
        rows.push(h('div', { key: 'logs', className: 'dtn-panel-block' }, [
        h('div', { key: 'head', className: 'dtn-panel-head' }, [
          h('span', { key: 'title', className: 'dtn-card-title' }, t('logsLabel')),
          h('span', { key: 'count', className: 'dtn-foot-note' }, String(viewLogs.length)),
        ]),
        viewLogs.length === 0 ? null : h('div', { key: 'list', className: 'dtn-panel-trail' },
          viewLogs.slice().reverse().map((log, position) => h('div', {
            key: 'log:' + log.index,
            className: 'dtn-note-log' + (editingLog === log.index ? ' is-editing' : ''),
          }, editingLog === log.index
            ? [h(LogEditBox, {
              key: 'edit',
              t,
              text: log.text,
              onSave: (text) => { saveLogEdit(log.index, text); },
              onCancel: () => { setEditingLog(null); },
            })]
            : [
              h('span', { key: 'time', className: 'dtn-note-note' }, log.at === null ? '' : clockOf(log.at)),
              h('span', { key: 'text', className: 'dtn-note-log-text' }, log.text),
              h('button', {
                key: 'edit',
                type: 'button',
                className: 'dtn-ref-drop',
                title: t('logEdit'),
                'aria-label': t('logEdit'),
                onClick: () => { setEditingLog(log.index); },
              }, '✎'),
              h('button', {
                key: 'drop',
                type: 'button',
                className: 'dtn-ref-drop',
                title: t('removeLog'),
                'aria-label': t('removeLog'),
                onClick: log.remove,
              }, '×'),
            ]))),
        h('div', { key: 'add', className: 'dtn-panel-row' }, [
          // A progress note is often a paragraph with a list in it, so it gets a
          // multi-line box: Enter wraps, Ctrl/Cmd+Enter commits.
          h('textarea', {
            key: 'input',
            ref: logRef,
            className: 'dtn-field dtn-log-input',
            rows: 3,
            value: logText,
            placeholder: t('logPlaceholder'),
            'aria-label': t('logsLabel'),
            onChange: (event) => { setLogText(event.target.value); },
            onKeyDown: (event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                addLog();
              }
            },
          }),
          h('button', { key: 'add', type: 'button', className: 'dtn-btn', onClick: addLog }, t('logAdd')),
        ]),
      ]));
      }

      rows.push(h('div', { key: 'flags', className: 'dtn-panel-row' }, [
        h('label', { key: 'done', className: 'dtn-check-line' }, [
          h('input', {
            key: 'cb',
            className: 'dtn-cb',
            type: 'checkbox',
            checked: done,
            onChange: (event) => { setDone(event.target.checked); },
          }),
          h('span', { key: 'label' }, t('countToday')),
        ]),
        h('span', { key: 'logTo', className: 'dtn-foot-note' }, t('logTo')),
        h('input', {
          key: 'day',
          className: 'dtn-date',
          type: 'date',
          value: day,
          'aria-label': t('logTo'),
          onChange: (event) => {
            if (event.target.value !== '') setDay(event.target.value);
          },
        }),
        h('span', { key: 'spacer', style: { flex: '1 1 auto' } }),
        h('button', { key: 'save', type: 'button', className: 'dtn-btn is-primary', onClick: commit }, t('save')),
        h('button', { key: 'cancel', type: 'button', className: 'dtn-btn', onClick: close }, t('cancel')),
        isEdit
          ? h('button', {
            key: 'remove',
            type: 'button',
            className: 'dtn-btn is-danger',
            onClick: () => {
              api.removeItem(item.id);
              close();
            },
          }, t('editorRemove'))
          : null,
      ]));

      return h('section', { className: 'dtn-panel' }, [
        h('div', { key: 'head', className: 'dtn-panel-head' }, [
          h('span', { key: 'title', className: 'dtn-card-title' },
            isEdit
              ? t('editorEdit')
              : (parent === undefined || parent === null ? t('entryCreate') : t('editorCreate'))),
          isEdit || parent === undefined || parent === null
            ? null
            : h('span', { key: 'under', className: 'dtn-foot-note' },
              t('editorUnder', { text: firstLine(parent.text) })),
          h('button', {
            key: 'close',
            type: 'button',
            className: 'dtn-btn is-quiet',
            onClick: close,
            style: { marginLeft: 'auto' },
          }, t('cancel')),
        ]),
        ...rows,
      ]);
    }

    /* ---------------------------------------------------------- the composer -- */

    /**
     * The composer at the foot of the page: one row for the common case, with
     * tags, the target day and the colour preview one press away.
     */
    function QuickComposer({ api, day, focusSignal, onDone }) {
      const t = api.t;
      const fixedDay = typeof day === 'string' && day !== '' ? day : null;
      const [text, setText] = useState('');
      const [tags, setTags] = useState([]);
      const [tagText, setTagText] = useState('');
      const [links, setLinks] = useState([]);
      const [linkUrl, setLinkUrl] = useState('');
      const [linkError, setLinkError] = useState(null);
      const [done, setDone] = useState(false);
      const [open, setOpen] = useState(false);
      const [targetDay, setTargetDay] = useState(fixedDay === null ? api.today : fixedDay);
      const [color, setColor] = useState(api.nextColor);
      const inputRef = useRef(null);

      // A composer pinned to a day follows that day.
      useEffect(() => {
        if (fixedDay !== null) setTargetDay(fixedDay);
      }, [fixedDay]);

      // Opening it from a calendar day puts the cursor straight in the field.
      useEffect(() => {
        if (focusSignal === undefined || focusSignal === 0) return;
        const node = inputRef.current;
        if (node !== null && typeof node.focus === 'function') node.focus();
      }, [focusSignal]);

      const focusComposer = () => {
        const node = inputRef.current;
        if (node !== null && typeof node.focus === 'function') node.focus();
      };

      const commit = () => {
        const value = text.trim();
        if (value === '') {
          focusComposer();
          return;
        }
        api.createItem({
          text: value,
          color,
          tags: mergeTags(tags, parseTagText(tagText)),
          links,
          done,
          day: targetDay,
        }, null);
        setText('');
        setTags([]);
        setTagText('');
        setLinks([]);
        setLinkUrl('');
        setLinkError(null);
        setDone(false);
        setColor(api.nextColor());
        // A composer opened for one day has done its job: put it away again.
        if (typeof onDone === 'function') onDone();
        focusComposer();
      };

      const toggleTag = (name) => {
        setTags((previous) => (
          previous.some((tag) => tagKey(tag) === tagKey(name))
            ? previous.filter((tag) => tagKey(tag) !== tagKey(name))
            : normalizeTags(previous.concat([name]))
        ));
      };

      const addTypedTags = () => {
        const parsed = parseTagText(tagText);
        if (parsed.length === 0) return;
        setTags((previous) => mergeTags(previous, parsed));
        setTagText('');
      };

      const chips = [];
      for (const option of api.tagOptions.slice(0, 8)) {
        const chosen = tags.some((tag) => tagKey(tag) === option.key);
        chips.push(h('button', {
          key: 'option:' + option.key,
          type: 'button',
          className: 'dtn-tag' + (chosen ? ' is-on' : ''),
          style: tagStyle(option.name, chosen),
          title: t('tagSuggest'),
          onClick: () => { toggleTag(option.name); },
        }, option.name + ' ' + option.count));
      }
      for (const tag of tags) {
        if (api.tagOptions.some((option) => option.key === tagKey(tag))) continue;
        chips.push(h('span', {
          key: 'new:' + tagKey(tag),
          className: 'dtn-tag is-on',
          style: tagStyle(tag, true),
        }, tag));
      }

      /** Queue one link for the entry about to be created; a pasted line works. */
      const addLink = () => {
        const parsed = parseLinkInput(linkUrl);
        if (parsed === null) {
          setLinkError(t('linkInvalid'));
          return;
        }
        setLinks((previous) => previous
          .filter((entry) => entry.url !== parsed.url)
          .concat([{ url: parsed.url, title: parsed.title }]));
        setLinkUrl('');
        setLinkError(null);
      };

      const linkChips = links.map((entry) => h('span', {
        key: 'link:' + entry.url,
        className: 'dtn-note-link',
      }, [
        h('span', { key: 'text', className: 'dtn-link-text', title: entry.url },
          entry.title === '' ? hostOf(entry.url) : entry.title),
        h('button', {
          key: 'drop',
          type: 'button',
          className: 'dtn-ref-drop',
          title: t('removeLink'),
          'aria-label': t('removeLink'),
          onClick: () => {
            setLinks((previous) => previous.filter((candidate) => candidate.url !== entry.url));
          },
        }, '×'),
      ]));

      const extra = open !== true ? null : h('div', { key: 'more', className: 'dtn-composer-extra' }, [
        h('div', { key: 'tags', className: 'dtn-composer-more' }, [
          h('span', { key: 'label', className: 'dtn-foot-note' }, t('tagsLabel')),
          ...chips,
          h('input', {
            key: 'tag-input',
            className: 'dtn-tag-input',
            type: 'text',
            value: tagText,
            placeholder: t('tagPlaceholder'),
            'aria-label': t('tagPlaceholder'),
            onChange: (event) => { setTagText(event.target.value); },
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addTypedTags();
              }
            },
            onBlur: addTypedTags,
          }),
          h('span', { key: 'spacer', style: { flex: '1 1 auto' } }),
          fixedDay !== null ? null : h('span', { key: 'logTo', className: 'dtn-foot-note' }, t('logTo')),
          fixedDay !== null ? null : h('input', {
            key: 'day',
            className: 'dtn-date',
            type: 'date',
            value: targetDay,
            'aria-label': t('logTo'),
            title: t('logTo'),
            onChange: (event) => {
              if (event.target.value !== '') setTargetDay(event.target.value);
            },
          }),
          fixedDay !== null || targetDay === api.today
            ? null
            : h('button', {
              key: 'today',
              type: 'button',
              className: 'dtn-navbtn',
              onClick: () => { setTargetDay(api.today); },
            }, t('backToday')),
        ]),
        // Links ride along with the entry being created: paste once, press
        // Enter, and the new entry already carries it.
        h('div', { key: 'links', className: 'dtn-composer-more' }, [
          h('span', { key: 'label', className: 'dtn-foot-note' }, t('linksLabel')),
          ...linkChips,
          h('input', {
            key: 'url',
            className: 'dtn-tag-input',
            type: 'text',
            value: linkUrl,
            placeholder: t('linkUrl'),
            'aria-label': t('linkUrl'),
            onChange: (event) => { setLinkUrl(event.target.value); },
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addLink();
              }
            },
          }),
          h('button', {
            key: 'add',
            type: 'button',
            className: 'dtn-btn is-quiet',
            onClick: addLink,
          }, t('linkAdd')),
          linkError === null ? null : h('span', { key: 'error', className: 'dtn-status is-error' }, linkError),
        ]),
      ]);

      const dismissable = typeof onDone === 'function';
      const headText = targetDay === api.today
        ? t('composerHeadToday')
        : t('backfillHint', { day: dayLabel(targetDay, t) });

      return h('section', { className: 'dtn-composer' }, [
        h('div', { key: 'inner', className: 'dtn-composer-inner' }, [
          // A composer that was opened says what it will create — today's entry
          // or a back-filled one — and offers the way out.
          dismissable !== true ? null : h('div', { key: 'head', className: 'dtn-composer-head' }, [
            h('span', { key: 'text', className: 'dtn-composer-head-text' }, headText),
            h('button', {
              key: 'close',
              type: 'button',
              className: 'dtn-composer-close',
              title: t('composerClose'),
              'aria-label': t('composerClose'),
              onClick: () => { onDone(); },
            }, '✕'),
          ]),
          h('div', { key: 'main', className: 'dtn-composer-row' }, [
            h('span', {
              key: 'dot',
              className: 'dtn-dot',
              style: { '--dtn-draft': color },
              title: t('tagAuto'),
            }),
            h('input', {
              key: 'text',
              ref: inputRef,
              className: 'dtn-composer-main',
              type: 'text',
              value: text,
              placeholder: t('quickAddLabel'),
              'aria-label': t('quickAddLabel'),
              onChange: (event) => { setText(event.target.value); },
              onKeyDown: (event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commit();
                } else if (event.key === 'Escape' && typeof onDone === 'function') {
                  // Escape dismisses a composer that a calendar day opened.
                  event.preventDefault();
                  onDone();
                }
              },
            }),
            h('label', { key: 'done', className: 'dtn-check-line' }, [
              h('input', {
                key: 'cb',
                className: 'dtn-cb',
                type: 'checkbox',
                checked: done,
                onChange: (event) => { setDone(event.target.checked); },
              }),
              h('span', { key: 'label' }, t('quickDone')),
            ]),
            h('button', {
              key: 'more-toggle',
              type: 'button',
              className: 'dtn-btn is-quiet',
              'aria-expanded': open,
              onClick: () => { setOpen(open !== true); },
            }, open === true ? t('composerLess') : t('composerMore')),
            h('button', { key: 'add', type: 'button', className: 'dtn-btn is-primary', onClick: commit }, t('add')),
          ]),
          extra,
        ]),
      ]);
    }

    /* ------------------------------------------------------------- the page -- */

    /** The to-do page: a full-width list under three tabs, with the composer pinned below. */
    function TodoPage(props) {
      const t = props.t;
      const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
      const today = todayKey();
      const [tab, setTab] = useState('open');
      const [monthAnchor, setMonthAnchor] = useState(monthStartOf(today));
      const [calendarDay, setCalendarDay] = useState(today);
      // The day the footer composer is pinned to, and whether it is showing at
      // all: the foot of the page is a button until something asks for a field.
      const [composerOpen, setComposerOpen] = useState(false);
      const [composerDay, setComposerDay] = useState(null);
      const [composerFocus, setComposerFocus] = useState(0);
      const [tagFilter, setTagFilter] = useState(null);
      // Free-text lookup over the entries. `lists` applies it together with the
      // tag filter, so both list tabs and their day groups agree on what shows.
      const [query, setQuery] = useState('');
      // The lookup field stays behind a magnifier until it is asked for, and
      // reopens itself while a term is active, so an active filter is never
      // invisible.
      const [searchOpen, setSearchOpen] = useState(false);
      const searchRef = useRef(null);

      useEffect(() => {
        if (searchOpen !== true) return;
        const node = searchRef.current;
        if (node !== null && node !== undefined && typeof node.focus === 'function') node.focus();
      }, [searchOpen]);
      const [renamingTag, setRenamingTag] = useState(null);
      const [renameText, setRenameText] = useState('');
      const [editingItemId, setEditingItemId] = useState(null);
      const [childParentId, setChildParentId] = useState(null);
      const [confirmingId, setConfirmingId] = useState(null);
      const [focusSection, setFocusSection] = useState('text');
      const [summaryDay, setSummaryDay] = useState(today);
      const [summaryEdit, setSummaryEdit] = useState(null);
      const [summaryFlash, setSummaryFlash] = useState(null);
      const [locEditing, setLocEditing] = useState(false);
      const [locDraft, setLocDraft] = useState('');
      const [locFlash, setLocFlash] = useState(null);
      const [locError, setLocError] = useState(null);
      const [locBusy, setLocBusy] = useState(false);
      const [visibleGroups, setVisibleGroups] = useState(FIRST_GROUPS);
      const [theme, setTheme] = useState(readTheme);
      const [scheme, setScheme] = useState(readScheme);

      useEffect(() => {
        writeTheme(theme);
      }, [theme]);

      useEffect(() => watchScheme(setScheme), []);

      useEffect(() => {
        void store.ensureLoaded();
      }, []);

      const items = state.items;

      const childrenMap = useMemo(() => {
        const known = new Set(items.map((entry) => entry.id));
        const map = new Map();
        for (const entry of items) {
          const key = entry.parentId !== null && known.has(entry.parentId) ? entry.parentId : null;
          const bucket = map.get(key);
          if (bucket === undefined) map.set(key, [entry]);
          else bucket.push(entry);
        }
        for (const bucket of map.values()) bucket.sort(compareSiblings);
        return map;
      }, [items]);

      const allTags = useMemo(() => tagOptionsOf(items), [items]);
      const byId = useMemo(() => new Map(items.map((entry) => [entry.id, entry])), [items]);
      const buckets = useMemo(() => dayBuckets(items), [items]);
      const calendarDays = useMemo(() => monthGridDays(monthAnchor), [monthAnchor]);
      const calendarView = useMemo(() => dayViewOf(items, calendarDay), [items, calendarDay]);
      const calendarIds = useMemo(() => ({
        open: new Set(calendarView.open.map((entry) => entry.id)),
        done: new Set(calendarView.done.map((entry) => entry.id)),
      }), [calendarView]);
      const todayStats = useMemo(() => todayStatsOf(items, today), [items, today]);
      const weekToday = useMemo(() => weekOf(items, today), [items, today]);
      const weekTotals = useMemo(() => weekToday.reduce(
        (totals, entry) => ({ planned: totals.planned + entry.planned, done: totals.done + entry.completed }),
        { planned: 0, done: 0 },
      ), [weekToday]);
      const view = useMemo(() => dayViewOf(items, summaryDay), [items, summaryDay]);
      const dayTags = useMemo(() => dayTagStats(view), [view]);
      const week = useMemo(() => weekOf(items, summaryDay), [items, summaryDay]);
      const weekMax = useMemo(() => week.reduce(
        (max, entry) => Math.max(max, entry.planned, entry.completed),
        1,
      ), [week]);
      const autoSummary = useMemo(() => summaryOf(summaryDay, view, dayTags, t), [summaryDay, view, dayTags, t]);
      const savedSummary = state.notes[summaryDay] === undefined ? null : state.notes[summaryDay].text;
      const summaryValue = summaryEdit !== null ? summaryEdit : (savedSummary === null ? autoSummary : savedSummary);
      const rate = (todayStats.completed + todayStats.open) === 0
        ? 0
        : Math.round((todayStats.completed / (todayStats.completed + todayStats.open)) * 100);

      const lists = useMemo(() => {
        const open = [];
        const done = [];
        const term = query.trim().toLowerCase();
        for (const entry of items) {
          if (tagFilter !== null && !hasTag(entry, tagFilter)) continue;
          if (term !== '' && !entryMatches(entry, term)) continue;
          if (entry.done) done.push(entry);
          else open.push(entry);
        }
        return { open, done };
      }, [items, tagFilter, query]);

      const currentList = tab === 'done' ? lists.done : lists.open;
      const groups = useMemo(() => groupByDay(currentList, tab === 'done'), [currentList, tab]);
      const shown = groups.slice(0, visibleGroups);
      const remaining = groups.length - shown.length;

      const api = {
        t,
        today,
        childrenMap,
        editingItemId,
        childParentId,
        confirmingId,
        tagFilter,
        tagOptions: allTags,
        canOpenSession: props.canOpenSession === true,
        setEditingItemId,
        setChildParentId,
        setConfirmingId,
        focusSection,
        /** One entry point for the editor panel; `section` only decides the focus. */
        openEditor: (id, section) => {
          setEditingItemId(id);
          setChildParentId(null);
          setConfirmingId(null);
          setFocusSection(section === undefined ? 'text' : section);
        },
        openChild: (id) => {
          setChildParentId(id);
          setEditingItemId(null);
          setConfirmingId(null);
          setFocusSection('text');
        },
        closeEditor: () => {
          setEditingItemId(null);
          setChildParentId(null);
          setFocusSection('text');
        },
        addLink: (id, url, title) => store.addLink(id, url, title),
        setProgress: (id, value) => store.setProgress(id, value),
        removeLink: (id, index) => store.removeLink(id, index),
        addLog: (id, text) => store.addLog(id, text),
        updateLog: (id, index, text) => store.updateLog(id, index, text),
        removeLog: (id, index) => store.removeLog(id, index),
        nextColor: () => store.nextColor(),
        toggleTagFilter: (name) => {
          setTagFilter((current) => (
            current !== null && tagKey(current) === tagKey(name) ? null : name
          ));
          setRenamingTag(null);
          setRenameText('');
          setVisibleGroups(FIRST_GROUPS);
        },
        toggleDone: (id) => { store.toggleDone(id); },
        toggleCollapse: (id) => { store.toggleCollapse(id); },
        removeItem: (id) => { store.removeItem(id); },
        removeRef: (id, index) => { store.removeRef(id, index); },
        moveToDay: (id, target) => { store.moveToDay(id, target); },
        createItem: (draft, parentId) => store.createItem(draft, parentId),
        updateItem: (id, draft, doneChanged, done) => { store.updateItem(id, draft, doneChanged, done); },
        openSession: (sessionId) => { openSession(sessionId); },
      };

      const applyRename = (from) => {
        const applied = store.renameTag(from, renameText);
        if (applied !== null) setTagFilter(applied);
        setRenamingTag(null);
        setRenameText('');
      };

      /** Point the data home somewhere else; the Host carries the files over. */
      const applyDirectory = async (value) => {
        setLocBusy(true);
        setLocError(null);
        setLocFlash(null);
        try {
          const result = await store.setDirectory(value);
          setLocEditing(false);
          setSummaryEdit(null);
          if (result.skipped.length > 0) {
            setLocFlash(t('locationSkipped', { names: result.skipped.join(', ') }));
          } else if (result.moved.length > 0) {
            setLocFlash(t('locationMoved', { count: result.moved.length }));
          } else {
            setLocFlash(t('summarySaved'));
          }
        } catch (error) {
          setLocError(t('saveFailed', { error: messageOf(error) }));
        } finally {
          setLocBusy(false);
        }
      };

      const pickTab = (key) => {
        setTab(key);
        setVisibleGroups(FIRST_GROUPS);
        // The composer is per tab (its pinned day means different things), so
        // switching tabs puts it away rather than carrying state across.
        setComposerOpen(false);
        setComposerDay(null);
      };

      const tabButton = (key, label, count) => h('button', {
        key,
        type: 'button',
        role: 'tab',
        'aria-selected': tab === key,
        className: 'dtn-tab' + (tab === key ? ' is-on' : ''),
        onClick: () => { pickTab(key); },
      }, [
        h('span', { key: 'label' }, label),
        count === undefined ? null : h('span', { key: 'count', className: 'dtn-tab-count' }, String(count)),
      ]);
      const tile = (key, label, value, tone, glyph) => h('div', {
        key,
        className: 'dtn-tile' + (tone === undefined ? '' : ' ' + tone),
      }, [
        h('span', { key: 'label', className: 'dtn-tile-label' }, label),
        h('span', { key: 'row', className: 'dtn-tile-row' }, [
          h('span', { key: 'num', className: 'dtn-tile-num' }, String(value)),
          glyph === undefined ? null : h('span', { key: 'glyph', className: 'dtn-tile-glyph' }, glyph),
        ]),
      ]);

      const stepSummaryDay = (target) => {
        setSummaryDay(target);
        setSummaryEdit(null);
        setSummaryFlash(null);
      };

      /* ------------------------------------------------------------- list -- */

      /** The entry the editor panel is open for, if any. */
      const targetItem = editingItemId !== null
        ? byId.get(editingItemId)
        : (childParentId !== null ? byId.get(childParentId) : undefined);
      const editorTarget = editingItemId !== null && targetItem !== undefined
        ? { mode: 'edit', item: targetItem }
        : (childParentId !== null && targetItem !== undefined
          ? { mode: 'create', parent: targetItem, parentDay: targetItem.day }
          : null);
      const editorHostId = editorTarget === null
        ? null
        : (editorTarget.mode === 'edit' ? editorTarget.item.id : editorTarget.parent.id);
      const editorPanel = editorTarget === null
        ? null
        : h(EditorPanel, {
          key: 'editor:' + editorHostId,
          api,
          target: editorTarget,
          focus: focusSection,
        });
      let panelPlaced = editorPanel === null;

      const listPane = [];
      const term = query.trim();
      if (term !== '') {
        // While looking something up, the colour note is noise; what helps is
        // knowing how many entries answered.
        listPane.push(h('p', { key: 'tag-hint', className: 'dtn-hint' },
          t('searchFound', { count: currentList.length, query: term })));
      } else if (tagFilter === null) {
        listPane.push(h('p', { key: 'tag-hint', className: 'dtn-foot-note' }, t('tagAutoHint')));
      } else {
        listPane.push(h('p', { key: 'tag-hint', className: 'dtn-hint' }, t('tagHint', { tag: tagFilter })));
      }
      if (shown.length === 0) {
        // One ternary each so neither nests: which "nothing here" applies, then
        // whether a search is what emptied the list.
        const idleEmptyKey = tab === 'done' ? 'emptyDone' : 'emptyActive';
        listPane.push(h('div', { key: 'empty', className: 'dtn-empty' }, [
          h('span', { key: 'glyph', className: 'dtn-empty-glyph' }, h(EmptyGlyph, null)),
          h('span', { key: 'text' }, term === '' ? t(idleEmptyKey) : t('searchEmpty', { query: term })),
        ]));
      } else {
        for (const group of shown) {
          const ids = new Set(group.list.map((entry) => entry.id));
          const inList = new Set(currentList.map((entry) => entry.id));
          const roots = group.list.filter((entry) => (
            entry.parentId === null || !inList.has(entry.parentId) || !ids.has(entry.parentId)
          ));
          // The editor opens under the day header of the entry it edits, full
          // width, so no column has to reflow while the user types.
          const hostHere = !panelPlaced && editorHostId !== null && ids.has(editorHostId);
          if (hostHere) panelPlaced = true;
          listPane.push(h('section', { key: group.key, className: 'dtn-group' }, [
            h('div', { key: 'head', className: 'dtn-group-head' }, [
              h('span', { key: 'title', className: 'dtn-group-title' }, groupLabel(group.key, t)),
              h('span', { key: 'count', className: 'dtn-group-count' }, t('groupTotal', { count: group.list.length })),
            ]),
            hostHere ? editorPanel : null,
            h('div', { key: 'list', className: 'dtn-masonry' },
              roots.map((entry, index) => h(NoteCard, {
                key: entry.id,
                api,
                item: entry,
                childIds: ids,
                tilt: index % 3 - 1,
              }))),
          ]));
        }
        if (remaining > 0) {
          listPane.push(h('button', {
            key: 'more',
            type: 'button',
            className: 'dtn-btn',
            onClick: () => { setVisibleGroups(visibleGroups + MORE_GROUPS); },
          }, t('showMore', { count: remaining })));
        }
      }
      // An entry filtered out of this tab still keeps its editor reachable.
      if (!panelPlaced && editorPanel !== null) listPane.push(editorPanel);

      /* --------------------------------------------------------- overview -- */

      const overviewPane = [
        h('section', { key: 'appearance', className: 'dtn-card' }, [
          h('div', { key: 'head', className: 'dtn-card-head' }, [
            h('span', { key: 'title', className: 'dtn-card-title' }, t('themeTitle')),
            h('span', { key: 'hint', className: 'dtn-card-note' }, t('themeHint')),
          ]),
          h('div', {
            key: 'chips',
            className: 'dtn-themes',
            role: 'group',
            'aria-label': t('themeTitle'),
          }, THEMES.map((id) => h('button', {
            key: id,
            type: 'button',
            className: 'dtn-theme-chip' + (theme === id ? ' is-on' : ''),
            'aria-pressed': theme === id,
            onClick: () => { setTheme(id); },
          }, [
            h('span', {
              key: 'swatch',
              className: 'dtn-theme-swatch t-' + id,
              'aria-hidden': 'true',
            }, [
              h('span', { key: 'a', className: 'dtn-theme-half sw-a' }),
              h('span', { key: 'b', className: 'dtn-theme-half sw-b' }),
            ]),
            h('span', { key: 'label', className: 'dtn-theme-name' }, t('theme.' + id)),
          ]))),
        ]),
        h('div', { key: 'tiles', className: 'dtn-overview-grid' }, [
          tile('planned', t('statPlanned'), todayStats.planned, undefined, h(TilePlannedGlyph, null)),
          tile('done', t('statDone'), todayStats.completed, 'is-done', h(TileDoneGlyph, null)),
          tile('open', t('statOpen'), todayStats.open, todayStats.open > 0 ? 'is-open' : undefined, h(TileOpenGlyph, null)),
          tile('rate', t('statRate'), rate + '%', 'is-rate', h(TileRateGlyph, null)),
        ]),
        h('div', { key: 'progress', className: 'dtn-progress', role: 'presentation' },
          h('span', { className: 'dtn-progress-fill', style: { width: rate + '%' } })),
        h('section', { key: 'summary', className: 'dtn-card' }, [
          h('div', { key: 'head', className: 'dtn-card-head' }, [
            h('span', { key: 'title', className: 'dtn-card-title' }, t('summaryTitle')),
            h('span', { key: 'note', className: 'dtn-card-note' },
              summaryFlash === null
                ? (savedSummary === null ? t('summaryAuto') : t('summarySaved'))
                : summaryFlash),
            h('span', { key: 'day', className: 'dtn-card-day' }, [
              h('button', {
                key: 'prev',
                type: 'button',
                className: 'dtn-navbtn',
                title: t('prevDay'),
                'aria-label': t('prevDay'),
                onClick: () => { stepSummaryDay(shiftDay(summaryDay, -1)); },
              }, '←'),
              h('span', { key: 'label', className: 'dtn-today' }, dayLabel(summaryDay, t)),
              h('button', {
                key: 'next',
                type: 'button',
                className: 'dtn-navbtn',
                title: t('nextDay'),
                'aria-label': t('nextDay'),
                onClick: () => { stepSummaryDay(shiftDay(summaryDay, 1)); },
              }, '→'),
              summaryDay === today
                ? null
                : h('button', {
                  key: 'today',
                  type: 'button',
                  className: 'dtn-navbtn',
                  onClick: () => { stepSummaryDay(today); },
                }, t('backToday')),
            ]),
          ]),
          h('textarea', {
            key: 'text',
            className: 'dtn-summary',
            value: summaryValue,
            'aria-label': t('summaryTitle'),
            onChange: (event) => { setSummaryEdit(event.target.value); },
          }),
          h('div', { key: 'actions', className: 'dtn-card-actions' }, [
            h('button', {
              key: 'save',
              type: 'button',
              className: 'dtn-btn is-primary',
              onClick: () => {
                store.saveNote(summaryDay, summaryValue);
                setSummaryEdit(null);
                setSummaryFlash(t('summarySaved'));
              },
            }, t('summarySave')),
            h('button', {
              key: 'copy',
              type: 'button',
              className: 'dtn-btn',
              onClick: () => {
                const done = () => { setSummaryFlash(t('summaryCopied')); };
                try {
                  const attempt = navigator.clipboard.writeText(summaryValue);
                  if (attempt !== undefined && typeof attempt.then === 'function') attempt.then(done, done);
                  else done();
                } catch (error) {
                  done();
                }
              },
            }, t('summaryCopy')),
            savedSummary === null && summaryEdit === null ? null : h('button', {
              key: 'reset',
              type: 'button',
              className: 'dtn-btn',
              onClick: () => {
                store.saveNote(summaryDay, '');
                setSummaryEdit(null);
                setSummaryFlash(null);
              },
            }, t('summaryReset')),
            h('button', {
              key: 'agent',
              type: 'button',
              className: 'dtn-btn',
              title: t('summaryAgentHint'),
              onClick: () => {
                summaryRequest.request(agentPromptOf(summaryDay, view, t));
                if (typeof props.openConversation === 'function') props.openConversation();
              },
            }, t('summaryAgent')),
          ]),
        ]),
        h('section', { key: 'week', className: 'dtn-card' }, [
          h('div', { key: 'head', className: 'dtn-card-head' }, [
            h('span', { key: 'title', className: 'dtn-card-title' }, t('weekTitle')),
          h('span', { key: 'legend', className: 'dtn-legend' }, [
            h('span', { key: 'a', className: 'dtn-legend-item' }, [
              h('span', { key: 'chip', className: 'dtn-legend-chip is-done' }),
              h('span', { key: 'text' }, t('weekLegendDone')),
            ]),
            h('span', { key: 'b', className: 'dtn-legend-item' }, [
              h('span', { key: 'chip', className: 'dtn-legend-chip is-open' }),
              h('span', { key: 'text' }, t('weekLegendPlanned')),
            ]),
          ]),
        ]),
        // One bar per day: its height is what was logged, the filled part is
        // what got finished, so the pair reads in a single hue instead of two.
        h('div', { key: 'bars', className: 'dtn-bars' }, week.map((entry) => {
          const total = Math.max(entry.planned, entry.completed);
          const height = Math.max(4, Math.round((total / weekMax) * 78));
          const filled = total === 0 ? 0 : Math.round((Math.min(entry.completed, total) / total) * 100);
          return h('button', {
            key: entry.key,
            type: 'button',
            className: 'dtn-bar-col' + (entry.key === summaryDay ? ' is-on' : ''),
            title: entry.key + ' · ' + t('weekLegendPlanned') + ' ' + entry.planned
              + ' · ' + t('weekLegendDone') + ' ' + entry.completed,
            onClick: () => { stepSummaryDay(entry.key); },
          }, [
            h('span', { key: 'stack', className: 'dtn-bar-stack' }, h('span', {
              key: 'bar',
              className: 'dtn-bar',
              style: { height: height + 'px' },
            }, h('span', {
              className: 'dtn-bar-done',
              style: { height: filled + '%' },
            }))),
            h('span', { key: 'value', className: 'dtn-bar-value' },
              entry.completed > 0 ? entry.completed + '/' + entry.planned : String(entry.planned)),
            h('span', { key: 'label', className: 'dtn-bar-label' }, entry.label),
          ]);
        })),
        ]),
        allTags.length === 0 ? null : h('section', { key: 'tags', className: 'dtn-card' }, [
          h('div', { key: 'head', className: 'dtn-card-head' }, [
            h('span', { key: 'title', className: 'dtn-card-title' }, t('tagsTitle')),
            h('span', { key: 'filter', className: 'dtn-card-note' }, t('tagFilterLabel')),
          ]),
          h('div', { key: 'bar', className: 'dtn-tag-bar' }, [
            h('button', {
              key: 'all',
              type: 'button',
              className: 'dtn-tag' + (tagFilter === null ? ' is-on' : ''),
              'aria-pressed': tagFilter === null,
              onClick: () => {
                setTagFilter(null);
                setRenamingTag(null);
                setRenameText('');
              },
            }, t('tagAll')),
            ...allTags.map((tag) => (
              renamingTag !== null && tagKey(renamingTag) === tag.key
                ? h('span', { key: 'rename:' + tag.key, className: 'dtn-tag-editor' }, [
                  h('input', {
                    key: 'input',
                    className: 'dtn-tag-input',
                    type: 'text',
                    value: renameText,
                    'aria-label': t('tagRenameHint', { name: tag.name }),
                    title: t('tagRenameHint', { name: tag.name }),
                    onChange: (event) => { setRenameText(event.target.value); },
                    onKeyDown: (event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        applyRename(tag.name);
                      } else if (event.key === 'Escape') {
                        event.preventDefault();
                        setRenamingTag(null);
                        setRenameText('');
                      }
                    },
                  }),
                  h('button', {
                    key: 'save',
                    type: 'button',
                    className: 'dtn-tag is-on',
                    style: tagStyle(tag.name, true),
                    onClick: () => { applyRename(tag.name); },
                  }, t('tagRenameSave')),
                  h('button', {
                    key: 'cancel',
                    type: 'button',
                    className: 'dtn-tag',
                    onClick: () => { setRenamingTag(null); setRenameText(''); },
                  }, t('cancel')),
                ])
                : h('button', {
                  key: tag.key,
                  type: 'button',
                  className: 'dtn-tag' + (tagFilter !== null && tagKey(tagFilter) === tag.key ? ' is-on' : ''),
                  style: tagStyle(tag.name, tagFilter !== null && tagKey(tagFilter) === tag.key),
                  'aria-pressed': tagFilter !== null && tagKey(tagFilter) === tag.key,
                  onClick: () => {
                    setTagFilter(tagFilter !== null && tagKey(tagFilter) === tag.key ? null : tag.name);
                    setRenamingTag(null);
                    setRenameText('');
                  },
                }, tag.name + ' ' + tag.count)
            )),
            tagFilter === null ? null : h('button', {
              key: 'rename',
              type: 'button',
              className: 'dtn-tag',
              title: t('tagRename'),
              onClick: () => { setRenamingTag(tagFilter); setRenameText(tagFilter); },
            }, t('tagRename')),
          ]),
        ]),
      ];

      /* ---------------------------------------------------------- calendar -- */

      const monthLabel = t('monthLabel', {
        year: monthAnchor.slice(0, 4),
        month: String(Number(monthAnchor.slice(5, 7))),
      });

      const calendarCell = (key) => {
        const bucket = buckets.get(key);
        const logged = bucket === undefined ? [] : bucket.logged;
        const done = bucket === undefined ? [] : bucket.done;
        const rows = logged.length > 0 ? logged : done;
        const outOfMonth = key.slice(0, 7) !== monthAnchor.slice(0, 7);
        const classes = ['dtn-cal-cell'];
        if (outOfMonth) classes.push('is-out');
        if (key === today) classes.push('is-today');
        if (key === calendarDay) classes.push('is-on');
        const marks = [];
        if (logged.length > 0) {
          marks.push(h('span', { key: 'l', className: 'dtn-cal-count' }, t('dayLogged', { count: logged.length })));
        }
        if (done.length > 0) {
          marks.push(h('span', { key: 'd', className: 'dtn-cal-count is-done' }, t('dayDone', { count: done.length })));
        }
        return h('button', {
          key,
          type: 'button',
          className: classes.join(' '),
          'aria-pressed': key === calendarDay,
          title: t('calAddHint'),
          onClick: () => {
            // One click shows the day and opens its composer below the wall.
            setCalendarDay(key);
            setComposerDay(key);
            setComposerOpen(true);
            setComposerFocus(composerFocus + 1);
          },
        }, [
          h('span', { key: 'day', className: 'dtn-cal-daynum' }, String(Number(key.slice(8)))),
          h('span', { key: 'add', className: 'dtn-cal-add', 'aria-hidden': 'true' }, '＋'),
          marks.length === 0 ? null : h('span', { key: 'marks', className: 'dtn-cal-marks' }, marks),
          h('span', { key: 'rows', className: 'dtn-cal-rows' }, rows.slice(0, 3).map((entry) => h('span', {
            key: entry.id,
            className: 'dtn-cal-row' + (entry.done ? ' is-done' : ''),
            style: { '--dtn-row-color': entry.color },
            title: entry.text,
          }, [
            h('span', { key: 'text', className: 'dtn-cal-text' }, firstLine(entry.text)),
          ])).concat(rows.length > 3
            ? [h('span', { key: 'more', className: 'dtn-cal-more' }, t('calMore', { count: rows.length - 3 }))]
            : [])),
        ]);
      };

      const calendarDetailList = (key, title, list, ids) => (list.length === 0 ? null : h('div', {
        key,
        className: 'dtn-group',
      }, [
        h('div', { key: 'head', className: 'dtn-group-head' }, [
          h('span', { key: 'title', className: 'dtn-group-title' }, title),
          h('span', { key: 'count', className: 'dtn-group-count' }, String(list.length)),
        ]),
        h('div', { key: 'list', className: 'dtn-masonry' },
          list.map((entry) => h(NoteCard, {
            key: entry.id,
            api,
            item: entry,
            childIds: ids,
          }))),
      ]));

      const calendarPane = [
        h('div', { key: 'head', className: 'dtn-cal-head' }, [
          h('button', {
            key: 'prev',
            type: 'button',
            className: 'dtn-navbtn',
            title: t('monthPrev'),
            'aria-label': t('monthPrev'),
            onClick: () => { setMonthAnchor(monthStartOf(shiftDay(monthAnchor, -1))); },
          }, '‹'),
          h('span', { key: 'label', className: 'dtn-cal-month' }, monthLabel),
          h('button', {
            key: 'next',
            type: 'button',
            className: 'dtn-navbtn',
            title: t('monthNext'),
            'aria-label': t('monthNext'),
            onClick: () => { setMonthAnchor(monthStartOf(shiftDay(monthAnchor, 32))); },
          }, '›'),
          h('button', {
            key: 'today',
            type: 'button',
            className: 'dtn-btn is-quiet',
            onClick: () => {
              setMonthAnchor(monthStartOf(today));
              setCalendarDay(today);
            },
          }, t('monthToday')),
        ]),
        h('div', { key: 'week', className: 'dtn-cal-week' },
          WEEK_SHORT_KEYS.map((key) => h('span', { key, className: 'dtn-cal-weekday' }, t(key)))),
        h('div', { key: 'grid', className: 'dtn-cal-grid' }, calendarDays.map(calendarCell)),
        h('div', { key: 'detail', className: 'dtn-panel-block' }, [
          h('div', { key: 'head', className: 'dtn-panel-head' }, [
            h('span', { key: 'title', className: 'dtn-card-title' },
              t('dayDetail', { day: dayLabel(calendarDay, t) })),
            h('span', { key: 'counts', className: 'dtn-foot-note' },
              t('dayLogged', { count: calendarView.logged.length })
              + ' · '
              + t('dayDone', { count: calendarView.done.length })),
            h('button', {
              key: 'add',
              type: 'button',
              className: 'dtn-btn is-primary',
              onClick: () => {
                setComposerDay(calendarDay);
                setComposerOpen(true);
                setComposerFocus(composerFocus + 1);
              },
              style: { marginLeft: 'auto' },
            }, '＋', t('add')),
          ]),
          calendarView.open.length === 0 && calendarView.done.length === 0
            ? h('p', { key: 'empty', className: 'dtn-empty-text' }, t('dayDetailEmpty'))
            : null,
          calendarDetailList('open', t('sectionActive'), calendarView.open, calendarIds.open),
          calendarDetailList('done', t('sectionDone'), calendarView.done, calendarIds.done),
        ]),
      ];

      /* ----------------------------------------------------------- header -- */

      const canPick = props.canPickDirectory === true;

      const toggleLocation = () => {
        setLocEditing(locEditing !== true);
        setLocDraft(state.directory === null ? '' : state.directory);
        setLocError(null);
        setLocFlash(null);
      };

      const locationPanel = locEditing !== true ? null : h('div', { key: 'locPanel', className: 'dtn-loc-panel' }, [
        h('input', {
          key: 'input',
          className: 'dtn-field',
          type: 'text',
          value: locDraft,
          placeholder: t('locationInvalid'),
          'aria-label': t('locationTitle'),
          onChange: (event) => { setLocDraft(event.target.value); },
          onKeyDown: (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void applyDirectory(locDraft);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              setLocEditing(false);
              setLocError(null);
            }
          },
        }),
        h('button', {
          key: 'pick',
          type: 'button',
          className: 'dtn-btn',
          disabled: canPick === false || locBusy,
          onClick: () => {
            void (async () => {
              const picked = await pickDirectory();
              if (picked !== null) setLocDraft(picked);
            })();
          },
        }, t('locationPick')),
        h('button', {
          key: 'save',
          type: 'button',
          className: 'dtn-btn is-primary',
          disabled: locBusy,
          onClick: () => { void applyDirectory(locDraft); },
        }, t('save')),
        h('button', {
          key: 'reset',
          type: 'button',
          className: 'dtn-btn',
          disabled: locBusy,
          onClick: () => { void applyDirectory(''); },
        }, t('locationReset')),
        h('button', {
          key: 'cancel',
          type: 'button',
          className: 'dtn-btn',
          disabled: locBusy,
          onClick: () => { setLocEditing(false); setLocError(null); },
        }, t('cancel')),
        h('span', { key: 'hint', className: 'dtn-foot-note' }, t('locationHint')),
        state.source === 'file' && state.journalLines > 0
          ? h('span', { key: 'journal', className: 'dtn-foot-note' }, t('locationJournal', { count: state.journalLines }))
          : null,
      ]);

      const storageParts = (() => {
        if (state.loaded !== true) {
          return [h('span', { key: 'loading', className: 'dtn-status' }, t('loading'))];
        }
        if (state.corrupt) {
          return [h('span', { key: 'corrupt', className: 'dtn-status is-warn' }, t('storageCorrupt'))];
        }
        if (state.source !== 'file') {
          return [h('span', { key: 'browser', className: 'dtn-status is-warn' },
            t('storageBrowser', { error: state.error === null ? '—' : state.error }))];
        }
        const parts = [];
        if (state.error !== null) {
          parts.push(h('span', { key: 'failed', className: 'dtn-status is-error' },
            t('saveFailed', { error: state.error })));
        } else if (state.saving) {
          parts.push(h('span', { key: 'saving', className: 'dtn-status' }, t('saving')));
        } else if (state.savedAt !== null) {
          parts.push(h('span', { key: 'saved', className: 'dtn-status' }, t('saved')));
        }
        if (state.directory !== null) {
          parts.push(h('span', { key: 'dir', className: 'dtn-status' },
            t('locationCurrent', { directory: state.directory })));
        }
        // Which backend is holding the data, and where it lives. A fallback is
        // worth saying out loud, because it changes what the files look like.
        if (state.storage === 'sqlite') {
          parts.push(h('span', {
            key: 'backend',
            className: 'dtn-badge is-ok',
            title: t('storageSqliteHint', { path: state.dbPath === null ? state.directory : state.dbPath }),
          }, t('storageSqlite')));
        } else if (state.storage === 'json' || state.storageNote !== null) {
          parts.push(h('span', {
            key: 'backend',
            className: 'dtn-badge is-warn',
            title: t('storageFallbackHint', { note: state.storageNote === null ? '—' : state.storageNote }),
          }, t('storageJson')));
        }
        if (state.migrated !== null && isFiniteNumber(state.migrated.items)) {
          parts.push(h('span', {
            key: 'migrated',
            className: 'dtn-badge is-ok',
            title: t('storageMigrated', { count: state.migrated.items }),
          }, t('storageMigrated', { count: state.migrated.items })));
        }
        return parts;
      })();

      // The lookup row: a content search over the entries, then the tag filter.
      // Both narrow the same lists, so the two can be combined.
      /** Clear the lookup and re-open the first groups; Esc and × both do this. */
      const clearSearch = () => {
        setQuery('');
        setVisibleGroups(FIRST_GROUPS);
      };

      /** Put the lookup away. Clearing first, so a hidden field never filters. */
      const closeSearch = () => {
        clearSearch();
        setSearchOpen(false);
      };

      // A box holding only spaces is not a term: it must not pin the field open.
      const searching = query.trim() !== '';
      const showSearch = searchOpen === true || searching;

      const searchBar = showSearch !== true ? null : h('div', { key: 'search', className: 'dtn-search' }, [
        h('input', {
          key: 'input',
          ref: searchRef,
          className: 'dtn-search-input',
          type: 'text',
          value: query,
          placeholder: t('searchPlaceholder'),
          'aria-label': t('searchLabel'),
          title: t('searchHint'),
          onChange: (event) => {
            setQuery(event.target.value);
            // A new term re-opens the first groups, or a match could stay hidden
            // behind "show earlier days".
            setVisibleGroups(FIRST_GROUPS);
          },
          onKeyDown: (event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              closeSearch();
            }
          },
        }),
        // With a term in the box this clears it; empty, it puts the box away.
        h('button', {
          key: 'clear',
          type: 'button',
          className: 'dtn-search-clear',
          title: searching ? t('searchClear') : t('searchHide'),
          'aria-label': searching ? t('searchClear') : t('searchHide'),
          onClick: searching ? clearSearch : closeSearch,
        }, '×'),
      ]);

      /** The magnifier: it opens the field, and closes it again once open. */
      const searchToggle = h('button', {
        key: 'search-toggle',
        type: 'button',
        className: 'dtn-search-toggle' + (showSearch === true ? ' is-on' : ''),
        title: showSearch === true ? t('searchHide') : t('searchLabel'),
        'aria-label': t('searchLabel'),
        'aria-expanded': showSearch === true,
        onClick: () => {
          if (showSearch === true) {
            closeSearch();
            return;
          }
          setSearchOpen(true);
        },
      }, h(SearchGlyph, null));

      const filterRow = h('div', { key: 'filter', className: 'dtn-filterbar' }, [
        searchBar,
        h('div', { key: 'line', className: 'dtn-filterline' }, [
          allTags.length === 0 ? null : h('div', {
            key: 'tags',
            className: 'dtn-filter',
            role: 'group',
            'aria-label': t('tagFilterLabel'),
          }, [
            h('span', { key: 'label', className: 'dtn-foot-note' }, t('tagFilterLabel')),
            h('button', {
              key: 'all',
              type: 'button',
              className: 'dtn-tag' + (tagFilter === null ? ' is-on' : ''),
              'aria-pressed': tagFilter === null,
              onClick: () => {
                setTagFilter(null);
                setVisibleGroups(FIRST_GROUPS);
              },
            }, t('tagAll')),
            ...allTags.map((tag) => h('button', {
              key: tag.key,
              type: 'button',
              className: 'dtn-tag' + (tagFilter !== null && tagKey(tagFilter) === tag.key ? ' is-on' : ''),
              style: tagStyle(tag.name, tagFilter !== null && tagKey(tagFilter) === tag.key),
              'aria-pressed': tagFilter !== null && tagKey(tagFilter) === tag.key,
              onClick: () => {
                setTagFilter(tagFilter !== null && tagKey(tagFilter) === tag.key ? null : tag.name);
                setVisibleGroups(FIRST_GROUPS);
              },
            }, tag.name + ' ' + tag.count)),
          ]),
          searchToggle,
        ]),
      ]);

      return h('div', {
        className: 'dtn-page t-' + theme,
        'data-scheme': scheme,
      }, [
        h('header', { key: 'head', className: 'dtn-head' }, [
          h('div', { key: 'inner', className: 'dtn-head-inner' }, [
            h('h1', { key: 'h', className: 'dtn-title' }, t('title')),
            h('span', { key: 'today', className: 'dtn-today' },
              t('labelToday') + ' · ' + today + ' ' + weekdayOf(today, t)),
            h('span', { key: 'digest', className: 'dtn-digest' },
              t('digestToday', {
                planned: todayStats.planned,
                done: todayStats.completed,
                open: todayStats.open,
              })),
            h('span', { key: 'week', className: 'dtn-digest' },
              t('weekNote', { planned: weekTotals.planned, done: weekTotals.done })),
            // The one entry point, in the top-right corner of the page.
            h('button', {
              key: 'add',
              type: 'button',
              className: 'dtn-head-add' + (composerOpen === true ? ' is-open' : ''),
              'aria-expanded': composerOpen === true,
              title: t('composerTrigger'),
              onClick: () => {
                if (composerOpen === true) {
                  setComposerOpen(false);
                  setComposerDay(null);
                  return;
                }
                setComposerDay(tab === 'calendar' ? calendarDay : null);
                setComposerOpen(true);
                setComposerFocus(composerFocus + 1);
              },
            }, [
              h('span', { key: 'plus', className: 'dtn-head-add-plus' }, composerOpen === true ? '✕' : '＋'),
              h('span', { key: 'label' },
                composerOpen === true ? t('composerClose') : t('composerTrigger')),
            ]),
          ]),
          h('div', { key: 'status', className: 'dtn-status-row' }, [
            ...storageParts,
            locFlash === null ? null : h('span', { key: 'flash', className: 'dtn-status' }, locFlash),
            locError === null ? null : h('span', { key: 'error', className: 'dtn-status is-error' }, locError),
            h('span', { key: 'actions', className: 'dtn-status-actions' }, [
              state.defaultDirectory !== null && state.directory !== state.defaultDirectory
                ? h('button', {
                  key: 'default',
                  type: 'button',
                  className: 'dtn-btn is-quiet',
                  disabled: locBusy,
                  onClick: () => { void applyDirectory(''); },
                }, t('locationDefault'))
                : null,
              h('button', {
                key: 'change',
                type: 'button',
                className: 'dtn-btn is-quiet',
                onClick: toggleLocation,
              }, t('locationChange')),
            ]),
          ]),
          locationPanel,
        ]),
        // The composer opens from the top-right button and lives under the
        // header, so the foot of the page stays free.
        composerOpen !== true
          ? null
          : h(QuickComposer, {
            key: 'composer',
            api,
            day: tab === 'calendar' ? (composerDay === null ? calendarDay : composerDay) : null,
            focusSignal: composerFocus,
            onDone: () => {
              setComposerOpen(false);
              setComposerDay(null);
            },
          }),
        h('div', { key: 'tabs', className: 'dtn-tabs', role: 'tablist' }, [
          tabButton('open', t('sectionActive'), lists.open.length),
          tabButton('done', t('sectionDone'), lists.done.length),
          tabButton('calendar', t('tabCalendar')),
          tabButton('overview', t('tabOverview')),
        ]),
        h('div', { key: 'body', className: 'dtn-body' }, [
          tab === 'overview'
            ? h('div', { key: 'pane', className: 'dtn-pane' }, overviewPane)
            : (tab === 'calendar'
              ? h('div', { key: 'pane', className: 'dtn-pane' }, calendarPane)
              : h('div', { key: 'pane', className: 'dtn-pane' }, [filterRow, ...listPane])),
        ]),
        // The foot of the page is a single button until a field is asked for:
        // the + button, or one click on a calendar day.
      ]);
    }

    /** Composer control: file what is in the composer as a to-do. */
    function TodoLinkButton(props) {
      const t = props.t;
      const panel = useSyncExternalStore(linkPanel.subscribe, linkPanel.getSnapshot, linkPanel.getSnapshot);
      const useInput = typeof props.useInput === 'function' ? props.useInput : () => undefined;
      const draft = useInput((value) => (
        value !== null && typeof value === 'object' && typeof value.draft === 'string' ? value.draft : ''
      ));
      const sessionId = typeof props.sessionId === 'string' ? props.sessionId : null;
      const pendingPrompt = useSyncExternalStore(
        summaryRequest.subscribe,
        summaryRequest.getSnapshot,
        summaryRequest.getSnapshot,
      );
      // A day handed over from the to-do page arrives here and lands in the composer.
      useEffect(() => {
        if (pendingPrompt === null) return;
        const actions = props.inputActions;
        if (actions !== undefined && actions !== null && typeof actions.setDraft === 'function') {
          actions.setDraft(pendingPrompt);
        }
        summaryRequest.clear();
      }, [pendingPrompt]);
      return h('button', {
        type: 'button',
        className: 'dtn-tool-btn' + (panel.open ? ' is-on' : ''),
        title: t('linkHint'),
        'aria-label': t('linkHint'),
        'aria-expanded': panel.open,
        onClick: () => {
          void store.ensureLoaded();
          linkPanel.toggle(sessionId, typeof draft === 'string' ? draft : '');
        },
      }, [
        h(LinkNoteGlyph, { key: 'icon' }),
        h('span', { key: 'label', className: 'dtn-tool-label' }, t('linkTitle')),
      ]);
    }

    /** The panel the composer control opens, docked below the composer card. */
    function TodoLinkPanel(props) {
      const t = props.t;
      const panel = useSyncExternalStore(linkPanel.subscribe, linkPanel.getSnapshot, linkPanel.getSnapshot);
      const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
      const [text, setText] = useState('');
      const [color, setColor] = useState(PALETTE[0].value);
      const [tags, setTags] = useState([]);
      const [tagText, setTagText] = useState('');
      const [done, setDone] = useState(false);
      const [clearDraft, setClearDraft] = useState(false);
      const [targetId, setTargetId] = useState('');
      const [result, setResult] = useState(null);
      const [failure, setFailure] = useState(null);
      const openedFor = useRef('');

      const sessionId = typeof props.sessionId === 'string'
        ? props.sessionId
        : (typeof panel.sessionId === 'string' ? panel.sessionId : null);
      const useSessions = typeof props.useSessions === 'function' ? props.useSessions : () => undefined;
      const sessionTitle = useSessions((value) => {
        if (sessionId === null || value === null || typeof value !== 'object') return undefined;
        const entry = value.byId === undefined ? undefined : value.byId[sessionId];
        if (entry === undefined) return undefined;
        if (typeof entry.displayTitle === 'string' && entry.displayTitle !== '') return entry.displayTitle;
        return typeof entry.title === 'string' ? entry.title : undefined;
      });

      useEffect(() => {
        void store.ensureLoaded();
      }, []);

      useEffect(() => {
        if (panel.open !== true) {
          openedFor.current = '';
          return;
        }
        const token = String(panel.sessionId) + '@' + String(panel.openedAt);
        if (openedFor.current === token) return;
        openedFor.current = token;
        setText(typeof panel.draft === 'string' ? panel.draft.trim() : '');
        setColor(store.nextColor());
        setTags([]);
        setTagText('');
        setDone(false);
        setTargetId('');
        setResult(null);
        setFailure(null);
      }, [panel.open, panel.sessionId, panel.openedAt, panel.draft]);

      /**
       * Options for the target picker: one indexing pass builds the tree, and
       * the list stays bounded so a long history never slows the panel down.
       */
      const options = useMemo(() => {
        const byParent = new Map();
        for (const item of state.items) {
          const bucket = byParent.get(item.parentId);
          if (bucket === undefined) byParent.set(item.parentId, [item]);
          else bucket.push(item);
        }
        for (const bucket of byParent.values()) bucket.sort(compareSiblings);
        const rows = [];
        const walk = (parentId, depth) => {
          for (const item of byParent.get(parentId) || []) {
            if (rows.length >= MAX_PICKER_OPTIONS) return;
            rows.push({ id: item.id, text: firstLine(item.text) || item.text, done: item.done, depth });
            if (depth < 3) walk(item.id, depth + 1);
          }
        };
        walk(null, 0);
        return rows;
      }, [state.items]);

      const tagOptions = useMemo(() => tagOptionsOf(state.items), [state.items]);

      const toggleTag = (name) => {
        setTags((previous) => (
          previous.some((tag) => tagKey(tag) === tagKey(name))
            ? previous.filter((tag) => tagKey(tag) !== tagKey(name))
            : normalizeTags(previous.concat([name]))
        ));
      };

      const addTypedTags = () => {
        const parsed = parseTagText(tagText);
        if (parsed.length === 0) return;
        setTags((previous) => mergeTags(previous, parsed));
        setTagText('');
      };

      if (panel.open !== true) return null;

      const save = () => {
        const value = text.trim();
        const chosen = mergeTags(tags, parseTagText(tagText));
        const session = sessionId === null ? null : {
          sessionId,
          title: typeof sessionTitle === 'string' ? sessionTitle : '',
          excerpt: firstLine(panel.draft).slice(0, 200),
          at: Date.now(),
        };
        if (targetId === '') {
          if (value === '') {
            setFailure(t('linkDraftEmpty'));
            return;
          }
          const item = store.createItem({
            text: value,
            color,
            tags: chosen,
            done,
            refs: session === null ? [] : [session],
          }, null);
          setResult({ kind: 'created', text: firstLine(item.text) || item.text });
        } else {
          const target = store.itemById(targetId);
          if (target === undefined) {
            setFailure(t('linkMissing'));
            return;
          }
          if (done === true && target.done !== true) store.setDone(targetId, true);
          store.addTags(targetId, chosen);
          if (session !== null) store.addRef(targetId, session);
          setResult({ kind: 'linked', text: firstLine(target.text) || target.text });
        }
        setTags([]);
        setTagText('');
        setFailure(null);
        if (clearDraft && props.inputActions !== null && typeof props.inputActions === 'object'
          && typeof props.inputActions.setDraft === 'function') {
          props.inputActions.setDraft('');
        }
      };

      const head = h('div', { key: 'head', className: 'dtn-link-head' }, [
        h('span', { key: 'heading', className: 'dtn-link-heading' }, t('linkHeading')),
        sessionId === null || typeof sessionTitle !== 'string' || sessionTitle === ''
          ? h('span', { key: 'session', className: 'dtn-foot-note' }, t('linkNoSession'))
          : h('span', { key: 'session', className: 'dtn-foot-note' }, t('refLabel') + '：' + sessionTitle),
      ]);

      if (result !== null) {
        return h('div', {
          className: 'dtn-link-panel',
          style: { '--dtn-accent': color, background: tint(color) },
        }, [
          head,
          h('p', { key: 'done', style: { margin: 0 } },
            result.kind === 'created' ? t('linkResultCreated', { text: result.text }) : t('linkResultLinked', { text: result.text })),
          h('div', { key: 'actions', className: 'dtn-editor-row' }, [
            h('button', {
              key: 'open',
              type: 'button',
              className: 'dtn-btn is-primary',
              onClick: () => { props.openPage(); linkPanel.close(); },
            }, t('linkOpenPage')),
            h('button', {
              key: 'close',
              type: 'button',
              className: 'dtn-btn',
              onClick: () => { linkPanel.close(); },
            }, t('linkClose')),
          ]),
        ]);
      }

      return h('div', {
        className: 'dtn-link-panel',
        style: { '--dtn-accent': color, background: tint(color) },
      }, [
        head,
        h('textarea', {
          key: 'text',
          className: 'dtn-field',
          rows: 2,
          value: text,
          placeholder: t('placeholderNew'),
          'aria-label': t('placeholderNew'),
          onChange: (event) => { setText(event.target.value); },
        }),
        h('div', { key: 'tags', className: 'dtn-tags' }, [
          h('span', { key: 'label', className: 'dtn-foot-note' }, t('tagsLabel')),
          ...tagOptions.slice(0, 6).map((option) => h('button', {
            key: option.key,
            type: 'button',
            className: 'dtn-tag' + (tags.some((tag) => tagKey(tag) === option.key) ? ' is-on' : ''),
            style: tagStyle(option.name, tags.some((tag) => tagKey(tag) === option.key)),
            title: t('tagSuggest'),
            onClick: () => { toggleTag(option.name); },
          }, option.name)),
          h('input', {
            key: 'input',
            className: 'dtn-tag-input',
            type: 'text',
            value: tagText,
            placeholder: t('tagPlaceholder'),
            'aria-label': t('tagPlaceholder'),
            onChange: (event) => { setTagText(event.target.value); },
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addTypedTags();
              }
            },
            onBlur: addTypedTags,
          }),
          ...tags
            .filter((tag) => !tagOptions.some((option) => option.key === tagKey(tag)))
            .map((tag) => h('span', {
              key: 'new:' + tagKey(tag),
              className: 'dtn-tag is-on',
              style: tagStyle(tag, true),
            }, tag)),
        ]),
        h('div', { key: 'row', className: 'dtn-editor-row' }, [
          h('span', { key: 'spacer', style: { flex: '1 1 auto' } }),
          h('select', {
            key: 'target',
            className: 'dtn-select',
            value: targetId,
            'aria-label': t('linkTarget'),
            title: t('linkTarget'),
            onChange: (event) => { setTargetId(event.target.value); },
          }, [h('option', { key: 'new', value: '' }, t('linkNew'))].concat(options.map((row) => h('option', {
            key: row.id,
            value: row.id,
          }, '　'.repeat(row.depth) + (row.done ? '✓ ' : '') + row.text)))),
        ]),
        h('div', { key: 'opts', className: 'dtn-editor-row' }, [
          h('label', { key: 'done', className: 'dtn-check-line' }, [
            h('input', {
              key: 'cb',
              className: 'dtn-cb',
              type: 'checkbox',
              checked: done,
              onChange: (event) => { setDone(event.target.checked); },
            }),
            h('span', { key: 'label' }, t('linkDone')),
          ]),
          h('label', { key: 'clear', className: 'dtn-check-line' }, [
            h('input', {
              key: 'cb',
              className: 'dtn-cb',
              type: 'checkbox',
              checked: clearDraft,
              onChange: (event) => { setClearDraft(event.target.checked); },
            }),
            h('span', { key: 'label' }, t('linkClear')),
          ]),
        ]),
        failure === null ? null : h('p', { key: 'failure', className: 'dtn-status is-error' }, failure),
        h('div', { key: 'actions', className: 'dtn-editor-row' }, [
          h('button', {
            key: 'save',
            type: 'button',
            className: 'dtn-btn is-primary',
            onClick: save,
          }, t('linkSave')),
          h('button', {
            key: 'cancel',
            type: 'button',
            className: 'dtn-btn',
            onClick: () => { linkPanel.close(); },
          }, t('linkCancel')),
        ]),
      ]);
    }

    /* ----------------------------------------------------------- the plugin -- */

    const inject = ['slots', 'layout', 'locale'];

    function apply(ctx) {
      const t = ctx.locale.bind(NS);
      const layout = ctx.layout;

      ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'todo-notes: dictionaries');

      ctx.effect(() => {
        const style = document.createElement('style');
        style.setAttribute('data-dsh-plugin', NS);
        style.textContent = CSS;
        document.head.appendChild(style);
        return () => { style.remove(); };
      }, 'todo-notes: styles');

      // Opening a linked Session is optional: the routes and the page work
      // without the workspace service, the link simply is not clickable then.
      ctx.inject(['uiWorkspace'], (workspaceCtx) => workspaceCtx.effect(() => {
        openSession = (sessionId) => {
          try {
            workspaceCtx.uiWorkspace.openSession(sessionId);
          } catch (error) {
            // A refused navigation keeps the page where it is.
          }
        };
        canOpenSession = true;
        pickDirectory = async () => {
          try {
            const picked = await workspaceCtx.uiWorkspace.pickDirectory();
            return typeof picked === 'string' && picked !== '' ? picked : null;
          } catch (error) {
            return null;
          }
        };
        canPickDirectory = true;
        return () => {
          openSession = function openSessionUnavailable() {};
          canOpenSession = false;
          pickDirectory = async function pickDirectoryUnavailable() { return null; };
          canPickDirectory = false;
        };
      }, 'todo-notes: open linked session'));

      // Leaving this plugin must not strand the user on a panel that no longer
      // exists: return to the Conversation, but only when this plugin owns it.
      ctx.effect(() => () => {
        try {
          if (layout.panelInfo.getSnapshot().activePanelId === PANEL_ID) layout.selectPanel(null);
        } catch (error) {
          // The layout service was already unloaded with the same profile change.
        }
      }, 'todo-notes: leave panel');

      ctx.slots.inject('main', () => ctx.slots.register({
        name: 'main',
        key: PANEL_ID,
        locale: NS,
        inject: () => ({
          t,
          canOpenSession,
          canPickDirectory,
          openConversation: () => {
            try {
              layout.selectPanel(null);
            } catch (error) {
              // Without a registered conversation panel the page stays where it is.
            }
          },
        }),
      }, TodoPage));

      ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: 20,
        label: () => t('panel'),
        locale: NS,
      }, TodoPanelIcon));

      ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
        name: 'conversation.input.left',
        id: 'todo-notes-link',
        order: 6,
        locale: NS,
      }, TodoLinkButton));

      ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
        name: 'conversation.composer.dock',
        id: 'todo-notes-link-panel',
        order: 6,
        locale: NS,
        inject: () => ({
          openPage: () => { layout.selectPanel(PANEL_ID); },
        }),
      }, TodoLinkPanel));
    }

    return { inject, apply };
  },
});

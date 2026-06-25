const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const MANAGED_PR_LABELS = [
  'ready-to-merge',
  'needs-rebase',
  'superseded',
  'stale-draft',
  'security-review',
  'large-feature',
];

export const PR_LABEL_DEFINITIONS = {
  'ready-to-merge': {
    color: '0e8a16',
    description: 'Green checks, current with main, and small enough to merge safely.',
  },
  'needs-rebase': {
    color: 'fbca04',
    description: 'Branch is behind the base branch and needs a refresh before merge.',
  },
  superseded: {
    color: 'cfd3d7',
    description: 'A newer canonical pull request already covers this workflow fix line.',
  },
  'stale-draft': {
    color: '5319e7',
    description: 'Draft pull request has been inactive long enough to close automatically.',
  },
  'security-review': {
    color: 'b60205',
    description: 'Security-sensitive change that needs a manual review before merge.',
  },
  'large-feature': {
    color: '1d76db',
    description: 'Large feature or high-churn PR that should be split or reviewed carefully.',
  },
};

const WORKFLOW_KEYWORDS = [
  'workflow',
  'github action',
  'github actions',
  'ci',
  'daily empire',
  'daily report',
  'dependabot config',
  'actions',
];

const DAILY_EMPIRE_KEYWORDS = ['daily empire', 'daily report'];
const SECURITY_KEYWORDS = ['security', 'vulnerability', 'cve', 'auth fix', 'secret'];
const PATCH_BUMP_PATTERN =
  /\bfrom\s+v?(\d+\.\d+\.\d+)\s+to\s+v?(\d+\.\d+\.\d+)\b/gi;
const SAFE_DUPLICATE_BRANCH_PREFIXES = ['sandbox/', 'copilot/'];
const BRANCH_DASHBOARD_ISSUE_TITLE = '🌿 Branch Dashboard';

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[`*_()[\]{}:;,/\\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasKeyword(text, keywords) {
  const normalized = normalizeText(text);
  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

function daysBetween(later, earlier) {
  return Math.max(0, Math.floor((toDate(later) - toDate(earlier)) / DAY_IN_MS));
}

function sortNumbers(values) {
  return [...values].sort((left, right) => left - right);
}

function toSlug(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseSemver(version) {
  const match = String(version || '').match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return null;
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  };
}

function diffSemver(previous, next) {
  if (previous.major !== next.major) {
    return 'major';
  }
  if (previous.minor !== next.minor) {
    return 'minor';
  }
  if (previous.patch !== next.patch) {
    return 'patch';
  }
  return 'none';
}

function parsePatchBumps(text) {
  const pairs = [];
  for (const match of String(text || '').matchAll(PATCH_BUMP_PATTERN)) {
    const previous = parseSemver(match[1]);
    const next = parseSemver(match[2]);
    if (previous && next) {
      pairs.push({ previous, next });
    }
  }
  return pairs;
}

export function isPatchDependabotPr(pr) {
  if (pr.authorLogin !== 'dependabot[bot]') {
    return false;
  }

  const pairs = parsePatchBumps(`${pr.title}\n${pr.body || ''}`);
  return pairs.length > 0 && pairs.every(({ previous, next }) => diffSemver(previous, next) === 'patch');
}

export function classifyPrTopic(pr, filePaths = []) {
  const workflowFiles = unique(
    filePaths.filter(
      (path) =>
        path.startsWith('.github/workflows/') ||
        path.startsWith('.github/actions/') ||
        path === '.github/dependabot.yml'
    )
  );
  const combinedText = [
    pr.title,
    pr.body,
    pr.headRefName || pr.headRef,
    pr.baseRefName || pr.baseRef,
    ...filePaths,
  ].join('\n');

  const touchesWorkflow = workflowFiles.length > 0;

  if (touchesWorkflow || hasKeyword(combinedText, WORKFLOW_KEYWORDS)) {
    if (workflowFiles.length > 0) {
      const workflowKey = workflowFiles
        .map((path) => path.replace(/^\.github\//, ''))
        .sort()
        .map((path) => toSlug(path))
        .join('|');

      if (workflowKey) {
        return `workflow:${workflowKey}`;
      }
    }

    if (hasKeyword(combinedText, DAILY_EMPIRE_KEYWORDS) || filePaths.some((path) => path.includes('daily-empire'))) {
      return 'workflow:daily-empire';
    }
    return 'workflow:generic-maintenance';
  }

  return null;
}

function calculateFileOverlap(leftPaths, rightPaths) {
  const left = new Set(leftPaths);
  const right = new Set(rightPaths);
  const intersection = [...left].filter((path) => right.has(path)).length;
  if (intersection === 0) {
    return 0;
  }
  return intersection / Math.max(left.size, right.size);
}

export function scorePullRequest(metadata) {
  let score = 100;

  score -= Math.min(metadata.ageDays, 45);
  score -= Math.min(metadata.inactiveDays, 30);

  if (metadata.isDraft) {
    score -= 35;
  }
  if (metadata.behindBy > 0) {
    score -= Math.min(25, metadata.behindBy);
  }
  if (metadata.checkState === 'failure') {
    score -= 35;
  } else if (metadata.checkState === 'pending') {
    score -= 12;
  }

  score -= Math.min(20, Math.max(0, metadata.changedFiles - 5));
  score -= Math.min(15, Math.floor(metadata.totalChanges / 400));
  score -= Math.round((metadata.fileOverlap || 0) * 30);

  if (metadata.isSuperseded) {
    score -= 40;
  }
  if (metadata.isLargeFeature) {
    score -= 20;
  }
  if (metadata.needsSecurityReview) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

export function determinePrLabels(metadata) {
  const labels = new Set();

  if (metadata.behindBy > 0) {
    labels.add('needs-rebase');
  }
  if (metadata.isSuperseded) {
    labels.add('superseded');
  }
  if (metadata.isStaleDraft) {
    labels.add('stale-draft');
  }
  if (metadata.needsSecurityReview) {
    labels.add('security-review');
  }
  if (metadata.isLargeFeature) {
    labels.add('large-feature');
  }
  if (
    !metadata.isDraft &&
    !metadata.isSuperseded &&
    metadata.behindBy === 0 &&
    metadata.checkState === 'success' &&
    !metadata.isLargeFeature &&
    metadata.score >= 70
  ) {
    labels.add('ready-to-merge');
  }

  return [...labels];
}

export function groupDuplicateBranches(branches) {
  const groups = new Map();

  for (const branch of branches) {
    const key = branch.sha;
    const existing = groups.get(key) || [];
    existing.push(branch);
    groups.set(key, existing);
  }

  return [...groups.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([sha, entries]) => ({
      sha,
      branches: [...entries].sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) => right.branches.length - left.branches.length || left.sha.localeCompare(right.sha));
}

export function pickSafeDuplicateBranchesForDeletion(branches) {
  const duplicateGroups = groupDuplicateBranches(branches);
  const deletions = [];

  for (const group of duplicateGroups) {
    const candidates = group.branches.filter(
      (branch) =>
        !branch.hasOpenPr &&
        !branch.isDefaultBranch &&
        !branch.protected &&
        SAFE_DUPLICATE_BRANCH_PREFIXES.some((prefix) => branch.name.startsWith(prefix))
    );

    if (candidates.length <= 1) {
      continue;
    }

    const keeper = [...candidates].sort((left, right) => {
      if (left.lastCommitDate !== right.lastCommitDate) {
        return left.lastCommitDate.localeCompare(right.lastCommitDate);
      }
      return left.name.localeCompare(right.name);
    })[0];

    for (const branch of candidates) {
      if (branch.name !== keeper.name) {
        deletions.push(branch.name);
      }
    }
  }

  return unique(
    deletions.map((name) => {
      const branch = branches.find((entry) => entry.name === name);
      return branch ? branch.name : null;
    })
  )
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

function formatCheckState(state) {
  if (state === 'success') {
    return 'green';
  }
  if (state === 'failure') {
    return 'failing';
  }
  return 'pending';
}

function formatAheadBehind(aheadBy, behindBy) {
  return `+${aheadBy}/-${behindBy}`;
}

function formatBoolean(value, truthy = 'yes', falsy = 'no') {
  return value ? truthy : falsy;
}

function truncate(value, maximum = 120) {
  const text = String(value || '');
  if (text.length <= maximum) {
    return text;
  }
  return `${text.slice(0, maximum - 1)}…`;
}

function buildMarkdownTable(headers, rows) {
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ];

  for (const row of rows) {
    lines.push(`| ${row.join(' | ')} |`);
  }

  return lines.join('\n');
}

async function ensureManagedLabels({ github, context, core }) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const existing = await github.paginate(github.rest.issues.listLabelsForRepo, {
    owner,
    repo,
    per_page: 100,
  });
  const existingNames = new Set(existing.map((label) => label.name));

  for (const [name, definition] of Object.entries(PR_LABEL_DEFINITIONS)) {
    if (existingNames.has(name)) {
      continue;
    }

    core.info(`Creating label ${name}`);
    await github.rest.issues.createLabel({
      owner,
      repo,
      name,
      color: definition.color,
      description: definition.description,
    });
  }
}

async function listOpenPullRequests({ github, context }) {
  return github.paginate(github.rest.pulls.list, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: 'open',
    per_page: 100,
  });
}

async function getPullRequestFiles({ github, context, pullNumber }) {
  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pullNumber,
    per_page: 100,
  });

  return files.map((file) => file.filename);
}

async function getCheckState({ github, context, ref }) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  const [combinedStatus, checkRuns] = await Promise.all([
    github.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref,
    }),
    github.rest.checks.listForRef({
      owner,
      repo,
      ref,
      per_page: 100,
    }),
  ]);

  const failingConclusions = new Set(['failure', 'timed_out', 'cancelled', 'action_required']);
  const hasFailingCheckRun = checkRuns.data.check_runs.some((run) => failingConclusions.has(run.conclusion));
  const hasPendingCheckRun = checkRuns.data.check_runs.some(
    (run) => run.status !== 'completed' || run.conclusion === null
  );

  if (combinedStatus.data.state === 'failure' || hasFailingCheckRun) {
    return 'failure';
  }
  if (combinedStatus.data.state === 'pending' || hasPendingCheckRun) {
    return 'pending';
  }
  return 'success';
}

async function compareBranchToBase({ github, context, basehead }) {
  try {
    const comparison = await github.rest.repos.compareCommitsWithBasehead({
      owner: context.repo.owner,
      repo: context.repo.repo,
      basehead,
    });

    return {
      status: comparison.data.status,
      aheadBy: comparison.data.ahead_by,
      behindBy: comparison.data.behind_by,
    };
  } catch (error) {
    if (error.status === 404 || error.status === 409) {
      return {
        status: 'unknown',
        aheadBy: 0,
        behindBy: 0,
      };
    }
    throw error;
  }
}

function pickCanonicalPullRequest(entries) {
  return [...entries].sort((left, right) => {
    if (left.isDraft !== right.isDraft) {
      return left.isDraft ? 1 : -1;
    }
    if (left.updatedAt !== right.updatedAt) {
      return right.updatedAt.localeCompare(left.updatedAt);
    }
    if (left.changedFiles !== right.changedFiles) {
      return left.changedFiles - right.changedFiles;
    }
    return right.number - left.number;
  })[0];
}

function markWorkflowDuplicates(entries) {
  const grouped = new Map();

  for (const entry of entries) {
    if (!entry.topicKey) {
      continue;
    }

    const bucket = grouped.get(entry.topicKey) || [];
    bucket.push(entry);
    grouped.set(entry.topicKey, bucket);
  }

  for (const candidates of grouped.values()) {
    if (candidates.length <= 1) {
      continue;
    }

    const canonical = pickCanonicalPullRequest(candidates);
    for (const candidate of candidates) {
      if (candidate.number === canonical.number) {
        continue;
      }

      const overlap = calculateFileOverlap(candidate.filePaths, canonical.filePaths);
      if (overlap >= 0.5 || candidate.topicKey === canonical.topicKey) {
        candidate.isSuperseded = true;
        candidate.fileOverlap = Math.max(candidate.fileOverlap, overlap);
        candidate.supersededBy = canonical.number;
      }
    }
  }
}

async function syncManagedLabels({ github, context, pullNumber, existingLabels, desiredLabels }) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const existingManaged = new Set(existingLabels.filter((label) => MANAGED_PR_LABELS.includes(label)));
  const desired = new Set(desiredLabels);

  const toAdd = [...desired].filter((label) => !existingManaged.has(label));
  if (toAdd.length > 0) {
    await github.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pullNumber,
      labels: toAdd,
    });
  }

  const toRemove = [...existingManaged].filter((label) => !desired.has(label));
  for (const label of toRemove) {
    try {
      await github.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: pullNumber,
        name: label,
      });
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }
  }

  return {
    added: toAdd,
    removed: toRemove,
  };
}

async function closePullRequest({ github, context, pullNumber, reason, dryRun }) {
  if (dryRun) {
    return;
  }

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: pullNumber,
    body: reason,
  });

  await github.rest.pulls.update({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pullNumber,
    state: 'closed',
  });
}

async function enableDependabotAutomerge({ github, context, pullRequestId, dryRun }) {
  if (dryRun) {
    return;
  }

  await github.graphql(
    `
      mutation EnableAutoMerge($pullRequestId: ID!) {
        enablePullRequestAutoMerge(
          input: {
            pullRequestId: $pullRequestId
            mergeMethod: SQUASH
          }
        ) {
          pullRequest {
            number
          }
        }
      }
    `,
    {
      pullRequestId,
    }
  );
}

export async function runPrJanitor({ github, context, core, dryRun = false }) {
  await ensureManagedLabels({ github, context, core });

  const openPullRequests = await listOpenPullRequests({ github, context });
  const workflowCandidates = openPullRequests.filter((pullRequest) =>
    hasKeyword(
      `${pullRequest.title}\n${pullRequest.body || ''}\n${pullRequest.head.ref}`,
      WORKFLOW_KEYWORDS
    )
  );

  const workflowFiles = new Map();
  for (const pullRequest of workflowCandidates) {
    workflowFiles.set(
      pullRequest.number,
      await getPullRequestFiles({
        github,
        context,
        pullNumber: pullRequest.number,
      })
    );
  }

  const evaluations = [];
  for (const pullRequest of openPullRequests) {
    const { data: pullRequestData } = await github.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pullRequest.number,
    });
    const filePaths = workflowFiles.get(pullRequest.number) || [];
    const comparison = await compareBranchToBase({
      github,
      context,
      basehead: `${pullRequestData.base.ref}...${pullRequestData.head.sha}`,
    });
    const checkState = await getCheckState({
      github,
      context,
      ref: pullRequestData.head.sha,
    });

    const topicKey = classifyPrTopic(
      {
        title: pullRequestData.title,
        body: pullRequestData.body,
        headRefName: pullRequestData.head.ref,
        baseRefName: pullRequestData.base.ref,
      },
      filePaths
    );

    const ageDays = daysBetween(new Date(), pullRequestData.created_at);
    const inactiveDays = daysBetween(new Date(), pullRequestData.updated_at);
    const needsSecurityReview =
      hasKeyword(`${pullRequestData.title}\n${pullRequestData.body || ''}`, SECURITY_KEYWORDS) ||
      pullRequestData.labels.some((label) => normalizeText(label.name).includes('security'));
    const isLargeFeature =
      (pullRequestData.changed_files || 0) >= 20 || (pullRequestData.additions || 0) >= 1000;

    evaluations.push({
      id: pullRequestData.node_id,
      number: pullRequestData.number,
      title: pullRequestData.title,
      htmlUrl: pullRequestData.html_url,
      authorLogin: pullRequestData.user?.login || '',
      body: pullRequestData.body || '',
      existingLabels: pullRequestData.labels.map((label) => label.name),
      headRef: pullRequestData.head.ref,
      baseRef: pullRequestData.base.ref,
      createdAt: pullRequestData.created_at,
      updatedAt: pullRequestData.updated_at,
      ageDays,
      inactiveDays,
      isDraft: pullRequestData.draft,
      changedFiles: pullRequestData.changed_files || 0,
      additions: pullRequestData.additions || 0,
      deletions: pullRequestData.deletions || 0,
      totalChanges: (pullRequestData.additions || 0) + (pullRequestData.deletions || 0),
      aheadBy: comparison.aheadBy,
      behindBy: comparison.behindBy,
      compareStatus: comparison.status,
      checkState,
      filePaths,
      fileOverlap: 0,
      topicKey,
      isSuperseded: false,
      supersededBy: null,
      isLargeFeature,
      needsSecurityReview,
      isStaleDraft: pullRequestData.draft && ageDays >= 30 && inactiveDays >= 14,
      isHeadMerged:
        comparison.aheadBy === 0 &&
        (comparison.status === 'behind' || comparison.status === 'identical'),
      isPatchDependabot: isPatchDependabotPr({
        authorLogin: pullRequestData.user?.login || '',
        title: pullRequestData.title,
        body: pullRequestData.body || '',
      }),
    });
  }

  markWorkflowDuplicates(evaluations);

  const summaryRows = [];
  const closedPullRequests = [];
  const automergedPullRequests = [];
  let labelUpdates = 0;

  for (const evaluation of evaluations) {
    evaluation.score = scorePullRequest(evaluation);
    evaluation.labels = determinePrLabels(evaluation);
    const syncResult = await syncManagedLabels({
      github,
      context,
      pullNumber: evaluation.number,
      existingLabels: evaluation.existingLabels,
      desiredLabels: evaluation.labels,
    });

    if (syncResult.added.length > 0 || syncResult.removed.length > 0) {
      labelUpdates += 1;
    }

    if (evaluation.isHeadMerged) {
      closedPullRequests.push(
        `#${evaluation.number} head already exists in ${evaluation.baseRef}`
      );
      await closePullRequest({
        github,
        context,
        pullNumber: evaluation.number,
        reason:
          'Closing automatically because this pull request head is already contained in the base branch.',
        dryRun,
      });
    } else if (evaluation.isStaleDraft) {
      closedPullRequests.push(`#${evaluation.number} stale draft`);
      await closePullRequest({
        github,
        context,
        pullNumber: evaluation.number,
        reason:
          'Closing automatically because this draft has been inactive long enough to treat it as stale work.',
        dryRun,
      });
    } else if (evaluation.isSuperseded && evaluation.topicKey?.startsWith('workflow:')) {
      closedPullRequests.push(`#${evaluation.number} superseded by #${evaluation.supersededBy}`);
      await closePullRequest({
        github,
        context,
        pullNumber: evaluation.number,
        reason: `Closing automatically because #${evaluation.supersededBy} is the canonical workflow-fix branch for this duplicate line of work.`,
        dryRun,
      });
    } else if (
      evaluation.isPatchDependabot &&
      evaluation.checkState === 'success' &&
      evaluation.behindBy === 0
    ) {
      automergedPullRequests.push(`#${evaluation.number}`);
      await enableDependabotAutomerge({
        github,
        context,
        pullRequestId: evaluation.id,
        dryRun,
      });
    }

    summaryRows.push([
      `#${evaluation.number}`,
      truncate(evaluation.title, 70),
      `${evaluation.score}`,
      evaluation.isDraft ? 'draft' : 'open',
      formatAheadBehind(evaluation.aheadBy, evaluation.behindBy),
      formatCheckState(evaluation.checkState),
      evaluation.labels.length > 0 ? evaluation.labels.join(', ') : '—',
    ]);
  }

  const topRows = [...evaluations]
    .sort((left, right) => right.score - left.score || left.number - right.number)
    .slice(0, 15)
    .map((evaluation) => [
      `#${evaluation.number}`,
      truncate(evaluation.title, 70),
      `${evaluation.score}`,
      evaluation.labels.length > 0 ? evaluation.labels.join(', ') : '—',
    ]);

  const summary = [
    `## PR janitor ${dryRun ? '(dry run)' : ''}`.trim(),
    '',
    `- Open PRs scanned: **${evaluations.length}**`,
    `- Label updates: **${labelUpdates}**`,
    `- Auto-closed: **${closedPullRequests.length}**`,
    `- Dependabot automerge enabled: **${automergedPullRequests.length}**`,
    '',
    '### Top scored PRs',
    buildMarkdownTable(['PR', 'Title', 'Score', 'Managed labels'], topRows),
    '',
    '### Auto-close actions',
    closedPullRequests.length > 0 ? closedPullRequests.map((entry) => `- ${entry}`).join('\n') : '- None',
    '',
    '### Dependabot automerge actions',
    automergedPullRequests.length > 0
      ? automergedPullRequests.map((entry) => `- ${entry}`).join('\n')
      : '- None',
  ].join('\n');

  await core.summary.addRaw(summary, true).write();
  return { summary, summaryRows };
}

async function listAllBranches({ github, context }) {
  return github.paginate(github.rest.repos.listBranches, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    per_page: 100,
  });
}

async function getCommitDate({ github, context, ref }) {
  const commit = await github.rest.repos.getCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    ref,
  });

  return (
    commit.data.commit.committer?.date ||
    commit.data.commit.author?.date ||
    new Date(0).toISOString()
  );
}

async function upsertBranchDashboardIssue({ github, context, body }) {
  const openIssues = await github.paginate(github.rest.issues.listForRepo, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    state: 'open',
    per_page: 100,
  });
  const existing = openIssues.find(
    (issue) => !issue.pull_request && issue.title === BRANCH_DASHBOARD_ISSUE_TITLE
  );

  if (existing) {
    await github.rest.issues.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: existing.number,
      title: BRANCH_DASHBOARD_ISSUE_TITLE,
      body,
    });
    return existing.number;
  }

  const issue = await github.rest.issues.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title: BRANCH_DASHBOARD_ISSUE_TITLE,
    body,
  });

  return issue.data.number;
}

async function deleteBranch({ github, context, name, dryRun }) {
  if (dryRun) {
    return;
  }

  try {
    await github.rest.git.deleteRef({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: `heads/${name}`,
    });
  } catch (error) {
    if (error.status !== 404 && error.status !== 422) {
      throw error;
    }
  }
}

export async function runBranchJanitor({ github, context, core, dryRun = false }) {
  const openPullRequests = await listOpenPullRequests({ github, context });
  const linkedPrs = new Map();
  for (const pullRequest of openPullRequests) {
    const bucket = linkedPrs.get(pullRequest.head.ref) || [];
    bucket.push(pullRequest.number);
    linkedPrs.set(pullRequest.head.ref, bucket);
  }

  const repository = await github.rest.repos.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
  });
  const defaultBranch = repository.data.default_branch;
  const branches = await listAllBranches({ github, context });
  const commitDateCache = new Map();
  const comparisons = new Map();
  const branchRows = [];

  for (const branch of branches) {
    const name = branch.name;
    const sha = branch.commit.sha;

    if (!commitDateCache.has(sha)) {
      commitDateCache.set(
        sha,
        await getCommitDate({
          github,
          context,
          ref: sha,
        })
      );
    }

    if (name !== defaultBranch) {
      comparisons.set(
        name,
        await compareBranchToBase({
          github,
          context,
          basehead: `${defaultBranch}...${name}`,
        })
      );
    }

    branchRows.push({
      name,
      sha,
      protected: branch.protected,
      isDefaultBranch: name === defaultBranch,
      linkedPrs: sortNumbers(linkedPrs.get(name) || []),
      hasOpenPr: linkedPrs.has(name),
      lastCommitDate: commitDateCache.get(sha),
      ...(comparisons.get(name) || { status: 'identical', aheadBy: 0, behindBy: 0 }),
    });
  }

  const duplicateGroups = groupDuplicateBranches(branchRows);
  const duplicateByBranch = new Map();
  for (const group of duplicateGroups) {
    for (const branch of group.branches) {
      duplicateByBranch.set(branch.name, group.branches.map((entry) => entry.name).filter((name) => name !== branch.name));
    }
  }

  for (const branch of branchRows) {
    branch.duplicateBranches = duplicateByBranch.get(branch.name) || [];
    branch.isMerged = !branch.isDefaultBranch && branch.aheadBy === 0 && ['behind', 'identical'].includes(branch.status);
    branch.isFarBehind = branch.behindBy >= 50;
  }

  const safeDuplicateDeleteNames = new Set(pickSafeDuplicateBranchesForDeletion(branchRows));

  const mergedDeletionCandidates = branchRows
    .filter(
      (branch) =>
        branch.isMerged &&
        !branch.hasOpenPr &&
        !branch.isDefaultBranch &&
        !branch.protected
    )
    .map((branch) => branch.name);

  const duplicateDeletionCandidates = branchRows
    .filter((branch) => safeDuplicateDeleteNames.has(branch.name))
    .map((branch) => branch.name);

  const deletionCandidates = unique([
    ...mergedDeletionCandidates,
    ...duplicateDeletionCandidates,
  ]).sort((left, right) => left.localeCompare(right));

  for (const branchName of deletionCandidates) {
    await deleteBranch({
      github,
      context,
      name: branchName,
      dryRun,
    });
  }

  const dashboardRows = branchRows
    .filter((branch) => !branch.isDefaultBranch)
    .sort((left, right) => {
      if (left.hasOpenPr !== right.hasOpenPr) {
        return left.hasOpenPr ? 1 : -1;
      }
      if (left.isMerged !== right.isMerged) {
        return left.isMerged ? -1 : 1;
      }
      return left.name.localeCompare(right.name);
    })
    .map((branch) => [
      `\`${branch.name}\``,
      branch.linkedPrs.length > 0 ? branch.linkedPrs.map((number) => `#${number}`).join(', ') : '—',
      formatBoolean(branch.isMerged, 'yes', 'no'),
      formatAheadBehind(branch.aheadBy, branch.behindBy),
      branch.duplicateBranches.length > 0 ? truncate(branch.duplicateBranches.join(', '), 60) : '—',
      branch.lastCommitDate.slice(0, 10),
    ]);

  const reviewCandidates = branchRows.filter(
    (branch) =>
      !branch.hasOpenPr &&
      !branch.isDefaultBranch &&
      !branch.isMerged &&
      !safeDuplicateDeleteNames.has(branch.name)
  );

  const branchIssueBody = [
    `# ${BRANCH_DASHBOARD_ISSUE_TITLE}`,
    '',
    `- Generated: ${new Date().toISOString()}`,
    `- Dry run: **${dryRun ? 'yes' : 'no'}**`,
    `- Total branches (excluding ${defaultBranch}): **${branchRows.length - 1}**`,
    `- Open-PR branches: **${branchRows.filter((branch) => branch.hasOpenPr).length}**`,
    `- Deleted or ready-to-delete merged branches: **${mergedDeletionCandidates.length}**`,
    `- Deleted or ready-to-delete duplicate no-PR sandbox/copilot branches: **${duplicateDeletionCandidates.length}**`,
    `- Remaining no-PR branches needing manual review: **${reviewCandidates.length}**`,
    '',
    '## Automatic cleanup',
    deletionCandidates.length > 0
      ? deletionCandidates.map((branch) => `- ${dryRun ? 'Would delete' : 'Deleted'} \`${branch}\``).join('\n')
      : '- None',
    '',
    '## Duplicate SHA groups',
    duplicateGroups.length > 0
      ? duplicateGroups
          .slice(0, 20)
          .map(
            (group) =>
              `- \`${group.sha.slice(0, 12)}\`: ${group.branches
                .map((branch) => `\`${branch.name}\``)
                .join(', ')}`
          )
          .join('\n')
      : '- None',
    '',
    '## Branch dashboard',
    buildMarkdownTable(
      ['Branch', 'Linked PR', 'Merged', 'Ahead/Behind', 'Duplicate SHA peers', 'Last commit'],
      dashboardRows
    ),
  ].join('\n');

  const issueNumber = await upsertBranchDashboardIssue({
    github,
    context,
    body: branchIssueBody,
  });

  const summary = [
    `## Branch janitor ${dryRun ? '(dry run)' : ''}`.trim(),
    '',
    `- Dashboard issue: #${issueNumber}`,
    `- Deleted merged branches: **${mergedDeletionCandidates.length}**`,
    `- Deleted duplicate sandbox/copilot branches: **${duplicateDeletionCandidates.length}**`,
    `- Manual review branches: **${reviewCandidates.length}**`,
  ].join('\n');

  await core.summary.addRaw(summary, true).write();
  return {
    summary,
    issueNumber,
    deletedBranches: deletionCandidates,
  };
}

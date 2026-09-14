import { describe, expect, it, vi } from 'vitest';

import {
  classifyPrTopic,
  canAutomaticallyClosePullRequest,
  determinePrLabels,
  getCommitDate,
  groupDuplicateBranches,
  isPatchDependabotPr,
  pickSafeDuplicateBranchesForDeletion,
  runBranchJanitor,
  scorePullRequest,
} from '../../scripts/github-maintenance.js';

describe('github maintenance helpers', () => {
  it('detects patch-only Dependabot pull requests', () => {
    expect(
      isPatchDependabotPr({
        authorLogin: 'dependabot[bot]',
        title: 'deps(npm): bump left-pad from 1.2.0 to 1.2.1',
        body: '',
      })
    ).toBe(true);

    expect(
      isPatchDependabotPr({
        authorLogin: 'dependabot[bot]',
        title: 'deps(npm): bump left-pad from 1.2.0 to 1.3.0',
        body: '',
      })
    ).toBe(false);
  });

  it('classifies workflow topics from changed workflow files', () => {
    const topic = classifyPrTopic(
      {
        title: 'Fix Daily Empire workflow failure',
        body: '',
        headRefName: 'fix-daily-empire',
        baseRefName: 'main',
      },
      ['.github/workflows/daily-empire.yml']
    );

    expect(topic).toBe('workflow:workflows-daily-empire-yml');
  });

  it('scores and labels small green pull requests as ready to merge', () => {
    const metadata = {
      ageDays: 1,
      inactiveDays: 0,
      isDraft: false,
      behindBy: 0,
      checkState: 'success',
      changedFiles: 2,
      totalChanges: 24,
      fileOverlap: 0,
      isSuperseded: false,
      isLargeFeature: false,
      needsSecurityReview: false,
      isStaleDraft: false,
    };

    const score = scorePullRequest(metadata);
    const labels = determinePrLabels({
      ...metadata,
      score,
    });

    expect(score).toBeGreaterThanOrEqual(70);
    expect(labels).toContain('ready-to-merge');
  });

  it('marks stale duplicate workflow pull requests as superseded', () => {
    const labels = determinePrLabels({
      score: 12,
      isDraft: false,
      behindBy: 4,
      checkState: 'failure',
      isSuperseded: true,
      isStaleDraft: false,
      needsSecurityReview: false,
      isLargeFeature: false,
    });

    expect(labels).toEqual(expect.arrayContaining(['needs-rebase', 'superseded']));
    expect(labels).not.toContain('ready-to-merge');
  });

  it('only auto-closes verified, low-risk merged or superseded pull requests', () => {
    const baseEvaluation = {
      needsSecurityReview: false,
      isLargeFeature: false,
      isHeadMerged: false,
      isSuperseded: true,
      topicKey: 'workflow:workflows-daily-empire-yml',
      fileOverlap: 0.75,
    };

    expect(canAutomaticallyClosePullRequest(baseEvaluation)).toBe(true);
    expect(
      canAutomaticallyClosePullRequest({
        ...baseEvaluation,
        fileOverlap: 0,
      })
    ).toBe(false);
    expect(
      canAutomaticallyClosePullRequest({
        ...baseEvaluation,
        needsSecurityReview: true,
      })
    ).toBe(false);
    expect(
      canAutomaticallyClosePullRequest({
        ...baseEvaluation,
        isHeadMerged: true,
        isLargeFeature: true,
      })
    ).toBe(false);
  });

  it('groups duplicate branches by SHA and chooses safe sandbox deletions', () => {
    const branches = [
      {
        name: 'sandbox/fix-security-a',
        sha: 'abc123',
        hasOpenPr: false,
        isDefaultBranch: false,
        protected: false,
        lastCommitDate: '2026-06-01T00:00:00.000Z',
      },
      {
        name: 'sandbox/fix-security-b',
        sha: 'abc123',
        hasOpenPr: false,
        isDefaultBranch: false,
        protected: false,
        lastCommitDate: '2026-06-02T00:00:00.000Z',
      },
      {
        name: 'feature/keep-me',
        sha: 'abc123',
        hasOpenPr: false,
        isDefaultBranch: false,
        protected: false,
        lastCommitDate: '2026-06-03T00:00:00.000Z',
      },
    ];

    const duplicateGroups = groupDuplicateBranches(branches);
    const deletions = pickSafeDuplicateBranchesForDeletion(branches);

    expect(duplicateGroups).toHaveLength(1);
    expect(deletions).toEqual(['sandbox/fix-security-a']);
  });

  it.each([
    ['404 response', { status: 404 }],
    ['409 response', { status: 409 }],
    ['500 response', { status: 500 }],
    ['fetch failed message', new Error('fetch failed')],
    ['No common ancestor message', new Error('No common ancestor between refs')],
  ])('falls back to the epoch for recoverable getCommitDate errors: %s', async (_, error) => {
    const github = {
      rest: {
        repos: {
          getCommit: vi.fn().mockRejectedValue(error),
        },
      },
    };
    const context = {
      repo: {
        owner: 'mrdannyclark82',
        repo: 'Milla-Rayne',
      },
    };

    await expect(
      getCommitDate({
        github,
        context,
        ref: 'abc123',
      })
    ).resolves.toBe(new Date(0).toISOString());
  });

  it('rethrows unexpected getCommitDate errors', async () => {
    const error = Object.assign(new Error('forbidden'), { status: 403 });
    const github = {
      rest: {
        repos: {
          getCommit: vi.fn().mockRejectedValue(error),
        },
      },
    };
    const context = {
      repo: {
        owner: 'mrdannyclark82',
        repo: 'Milla-Rayne',
      },
    };

    await expect(
      getCommitDate({
        github,
        context,
        ref: 'abc123',
      })
    ).rejects.toBe(error);
  });

  it('keeps branch janitor running when getCommitDate falls back', async () => {
    const summaryWrite = vi.fn().mockResolvedValue(undefined);
    const addRaw = vi.fn().mockReturnValue({
      write: summaryWrite,
    });
    const createIssue = vi.fn().mockResolvedValue({
      data: {
        number: 42,
      },
    });
    const github = {
      paginate: vi.fn(async (method) => {
        if (method === github.rest.pulls.list) {
          return [];
        }
        if (method === github.rest.repos.listBranches) {
          return [
            {
              name: 'main',
              protected: true,
              commit: { sha: 'main-sha' },
            },
            {
              name: 'feature/still-reviewed',
              protected: false,
              commit: { sha: 'feature-sha' },
            },
          ];
        }
        if (method === github.rest.issues.listForRepo) {
          return [];
        }
        return [];
      }),
      rest: {
        pulls: {
          list: vi.fn(),
        },
        repos: {
          listBranches: vi.fn(),
          get: vi.fn().mockResolvedValue({
            data: {
              default_branch: 'main',
            },
          }),
          getCommit: vi
            .fn()
            .mockResolvedValueOnce({
              data: {
                commit: {
                  committer: { date: '2026-09-10T00:00:00.000Z' },
                },
              },
            })
            .mockRejectedValueOnce(
              Object.assign(new Error('fetch failed'), { status: 500 })
            ),
          compareCommitsWithBasehead: vi.fn().mockResolvedValue({
            data: {
              status: 'ahead',
              ahead_by: 1,
              behind_by: 0,
            },
          }),
        },
        issues: {
          listForRepo: vi.fn(),
          create: createIssue,
          update: vi.fn(),
        },
        git: {
          deleteRef: vi.fn(),
        },
      },
    };
    const context = {
      repo: {
        owner: 'mrdannyclark82',
        repo: 'Milla-Rayne',
      },
    };
    const core = {
      summary: {
        addRaw,
      },
    };

    const result = await runBranchJanitor({
      github,
      context,
      core,
      dryRun: true,
      now: new Date('2026-09-14T00:00:00.000Z'),
    });

    expect(result.issueNumber).toBe(42);
    expect(createIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining('1970-01-01'),
      })
    );
    expect(summaryWrite).toHaveBeenCalled();
  });
});

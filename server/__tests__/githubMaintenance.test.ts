import { describe, expect, it } from 'vitest';

import {
  classifyPrTopic,
  determinePrLabels,
  groupDuplicateBranches,
  isPatchDependabotPr,
  pickSafeDuplicateBranchesForDeletion,
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
    expect(deletions).toEqual(['sandbox/fix-security-b']);
  });
});

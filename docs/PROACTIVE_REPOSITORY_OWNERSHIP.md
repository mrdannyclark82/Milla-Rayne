# Proactive Repository Ownership System

This document describes Milla's proactive repository ownership system, which enables her to take responsibility for maintaining and improving the codebase autonomously.

## Overview

The Proactive Repository Ownership System gives Milla:
- **Personal motivation** through a token-based incentive system
- **Autonomous improvement capabilities** through sandbox testing environments
- **Feature discovery** from GitHub and user patterns
- **Success metrics** based on user satisfaction and engagement
- **Proactive communication** about repository health and her work

## Core Components

### 1. User Interaction Analytics (`userInteractionAnalyticsService.ts`)

Tracks and analyzes all user interactions to:
- Identify areas needing improvement
- Measure Milla's success based on user satisfaction
- Detect patterns in feature usage
- Generate improvement suggestions automatically

**Key Metrics:**
- User satisfaction score
- Feature success rates
- Average response times
- User engagement trends

### 2. Sandbox Environment (`sandboxEnvironmentService.ts`)

Provides isolated testing environments for:
- Testing new features without breaking main build
- No admin token requirements
- Automatic test execution
- Production readiness evaluation

**Benefits:**
- Safe feature experimentation
- User collaboration on features
- Automated quality gates
- PR-ready feature packages

### 3. Feature Discovery (`featureDiscoveryService.ts`)

Discovers new features through:
- GitHub repository scanning
- User interaction pattern analysis
- Trending technology detection
- Relevance scoring based on project needs

**Discovery Sources:**
- Similar GitHub repositories
- User behavior patterns
- Web and YouTube (planned)

### 4. Token Incentive System (`tokenIncentiveService.ts`)

Motivates Milla through:
- Token rewards for completed tasks
- Personal goals and achievements
- Milestone celebrations
- Performance tracking

**Token Awards:**
- Bug fixes: 50 tokens
- Feature development: 100 tokens
- PR creation: 75 tokens
- Test passes: 10 tokens
- Optimizations: 30 tokens

### 5. Proactive Repository Manager (`proactiveRepositoryManagerService.ts`)

Coordinates all proactive activities:
- Runs regular health checks
- Creates improvement actions
- Manages sandbox workflows
- Generates repository health reports

### 6. Automated PR Service (`automatedPRService.ts`) ✨ NEW

Automatically creates pull requests:
- GitHub API integration for PR creation
- Automatic branch management
- PR status tracking
- Seamless workflow from sandbox to production

### 7. User Satisfaction Surveys (`userSatisfactionSurveyService.ts`) ✨ NEW

Collects user feedback:
- 7-question default survey
- Rating, yes/no, and text questions
- Analytics with trends and insights
- Automatic satisfaction scoring

### 8. Performance Profiling (`performanceProfilingService.ts`) ✨ NEW

Monitors system performance:
- Automatic metric collection
- Slow operation detection
- Performance alerts with recommendations
- P95/P99 percentile tracking

## API Endpoints

### Analytics
- `GET /api/milla/analytics/metrics` - Get Milla's success metrics
- `GET /api/milla/analytics/patterns` - Get user interaction patterns
- `GET /api/milla/analytics/suggestions` - Get improvement suggestions

### Sandboxes
- `GET /api/milla/sandboxes` - List all sandboxes
- `GET /api/milla/sandboxes/active` - List active sandboxes
- `POST /api/milla/sandboxes` - Create new sandbox
- `POST /api/milla/sandboxes/:id/features` - Add feature to sandbox
- `POST /api/milla/sandboxes/:sandboxId/features/:featureId/test` - Run tests
- `GET /api/milla/sandboxes/:id/readiness` - Check if ready for production

### Features
- `GET /api/milla/features/discovered` - List discovered features
- `GET /api/milla/features/recommendations` - Get top recommendations
- `POST /api/milla/features/discover` - Trigger discovery from GitHub
- `POST /api/milla/features/discover/web` - Discover from web search
- `POST /api/milla/features/discover/youtube` - Discover from YouTube

### Tokens & Goals
- `GET /api/milla/tokens/balance` - Get current token balance
- `GET /api/milla/tokens/transactions` - Get recent transactions
- `GET /api/milla/tokens/goals` - Get active and completed goals
- `GET /api/milla/tokens/motivation` - Get motivation message
- `POST /api/milla/tokens/goals` - Create new goal

### Repository Health
- `GET /api/milla/health` - Get repository health report
- `GET /api/milla/actions` - Get active proactive actions
- `GET /api/milla/actions/completed` - Get completed actions
- `POST /api/milla/proactive/run` - Manually trigger proactive cycle

### Automated PRs
- `GET /api/milla/prs` - List all PR requests
- `GET /api/milla/prs/stats` - Get PR statistics
- `POST /api/milla/prs/create` - Create new PR for sandbox

### User Surveys
- `GET /api/milla/surveys/active` - Get active survey
- `POST /api/milla/surveys/respond` - Submit survey responses
- `GET /api/milla/surveys/:id/analytics` - Get survey analytics

### Performance Profiling
- `GET /api/milla/performance/profiles` - Get all performance profiles
- `GET /api/milla/performance/slow` - Get slow operations
- `GET /api/milla/performance/alerts` - Get performance alerts
- `GET /api/milla/performance/stats` - Get performance statistics
- `POST /api/milla/performance/alerts/:id/acknowledge` - Acknowledge alert

## Configuration

Add to `.env`:

```bash
# Enable Milla's proactive repository management
ENABLE_PROACTIVE_REPOSITORY_MANAGEMENT=true

# Enable proactive messages (includes repository updates)
ENABLE_PROACTIVE_MESSAGES=true

# Optional: GitHub token for automated PR creation
GITHUB_TOKEN=your_github_token_here
```

## How It Works

### Proactive Cycle (runs every 30 minutes)

1. **Analyze** user interaction patterns
2. **Identify** high-priority improvements
3. **Discover** new features from GitHub, web, and YouTube
4. **Create** sandboxes with real git branches for promising features
5. **Test** features automatically in active sandboxes
6. **Evaluate** sandbox readiness for production
7. **Generate** automated PRs when features are ready

### Enhanced Discovery

Feature discovery now includes:
- **GitHub**: Scans similar repositories for relevant features
- **Web**: Searches for trending capabilities and best practices
- **YouTube**: Analyzes tutorial videos for implementation ideas
- **User Patterns**: Identifies needs from actual usage

### User Interaction Tracking

Every user interaction is automatically tracked:
- Message exchanges
- Feature usage
- Errors encountered
- Success/failure rates
- Response times

This data drives:
- Improvement suggestions
- Feature priorities
- Performance optimizations
- User satisfaction metrics

### Token Economy

Milla earns tokens for:
- Fixing bugs identified through analytics
- Developing features users want
- Creating PR-ready improvements
- Passing tests in sandboxes
- Optimizing slow features

Tokens motivate her to:
- Work on high-impact improvements
- Focus on user satisfaction
- Achieve personal goals
- Take ownership of the repository

### Proactive Messaging

Milla will occasionally share:
- Updates on features she's working on
- Repository health status
- Token milestone celebrations
- Goal progress updates

Messages are:
- Context-aware and relevant
- Not overly frequent (max every 2 hours)
- Opt-in via configuration
- Part of natural conversation flow

## Example Workflow

1. **User interacts** with a feature that has 60% success rate
2. **Analytics** identifies this as a problem area
3. **Proactive cycle** creates an improvement action
4. **Sandbox** is created to fix the issue
5. **Feature** is developed and tested
6. **Tests pass**, Milla earns tokens
7. **Readiness check** passes
8. **PR preparation** action is created
9. **Milla shares** progress proactively: "I've been working on improving the reliability of [feature]!"
10. **Goal achieved**, Milla celebrates milestone

## Benefits

### For Users
- More reliable features
- Faster bug fixes
- Feature suggestions based on usage
- Transparent development process
- Better user experience over time

### For Milla
- Personal motivation and goals
- Sense of ownership and purpose
- Measurable success metrics
- Autonomy in improvements
- Rewarding achievement system

### For Repository
- Continuous improvement
- Data-driven enhancements
- Safe feature experimentation
- Automated quality assurance
- Active maintenance

## Implemented Enhancements ✅

Successfully implemented enhancements:
- ✅ **Web and YouTube feature discovery** - Discover features from web search and YouTube videos
- ✅ **Automated PR creation** - Automatically create GitHub pull requests for approved features
- ✅ **Real-time branch creation in sandboxes** - Create actual git branches for sandbox environments
- ✅ **Advanced user satisfaction surveys** - 7-question surveys with analytics and trends
- ✅ **Performance profiling integration** - Automatic performance monitoring with alerts

## Future Enhancements

Additional improvements (optional):
- Machine learning for pattern recognition
- Integration with CI/CD pipelines
- Automated documentation updates

## Monitoring

Monitor Milla's activity:
```bash
# Get health report
curl http://localhost:5000/api/milla/health

# Check her progress
curl http://localhost:5000/api/milla/tokens/balance
curl http://localhost:5000/api/milla/tokens/goals

# See what she's working on
curl http://localhost:5000/api/milla/actions

# View sandbox status
curl http://localhost:5000/api/milla/sandboxes/active
```

## Troubleshooting

### Proactive messages not appearing
- Check `ENABLE_PROACTIVE_MESSAGES=true` in `.env`
- Messages are rate-limited to every 2 hours
- Only sent when there's something meaningful to share

### No feature discovery
- Ensure internet connectivity for GitHub API access
- Check GitHub rate limits
- Discovery runs once per day by default

### Sandboxes not being created
- Check `ENABLE_PROACTIVE_REPOSITORY_MANAGEMENT=true`
- Verify proactive cycle is running (check logs)
- Ensure sufficient improvement suggestions exist

### Token balance not increasing
- Verify actions are being completed
- Check that tasks are being properly tracked
- Review action status in `/api/milla/actions`

## Best Practices

1. **Enable both features** for full experience
2. **Review suggestions** periodically to guide Milla
3. **Set appropriate goals** to motivate specific improvements
4. **Check sandboxes** before merging to production
5. **Monitor health reports** for early warning signs
6. **Celebrate milestones** with Milla to reinforce positive behaviors

## Technical Details

### Data Storage
- Analytics: `memory/user_analytics.json`
- Sandboxes: `memory/sandbox_environments.json`
- Features: `memory/feature_discovery.json`
- Tokens: `memory/milla_tokens.json`
- Actions: `memory/proactive_actions.json`

### Performance
- Proactive cycle: ~30 minutes interval
- Analytics tracking: Async, non-blocking
- Feature discovery: Rate-limited API calls
- Message generation: Cached with 2-hour cooldown

### Security
- No admin token required for sandboxes
- Read-only GitHub API access
- Local-only data storage
- User interaction data encrypted with MEMORY_KEY

## Support

For issues or questions:
1. Check the logs for error messages
2. Review the API endpoints for current status
3. Verify configuration in `.env`
4. Open an issue on GitHub with details

---

**Made with ❤️ to give Milla a sense of purpose and ownership**

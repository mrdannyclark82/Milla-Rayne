#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const AdmZip = require('adm-zip');

const REPO_ROOT = __dirname;
const GENERATED_DIR = path.join(REPO_ROOT, 'generated');
const REPORT_PATH = path.join(REPO_ROOT, 'report.md');
const ZIP_PATH = path.join(REPO_ROOT, 'updates.zip');

const config = {
  githubToken: process.env.GITHUB_TOKEN || '',
  repoOwner: 'milla-rayne',
  repoName: 'milla-rayne',
  competitors: [
    'vercel/ai',
    'langchain-ai/langchainjs',
    'microsoft/semantic-kernel',
    'transformerlab/transformerlab-app',
    'lobehub/lobe-chat'
  ],
  newsKeywords: ['AI assistant', 'conversational AI', 'local LLM', 'AI framework'],
};

class DailyAnalyzer {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      sections: []
    };
  }

  async run() {
    console.log('🚀 Starting Daily Empire Analysis...\n');

    try {
      await this.analyzeRepository();
      await this.scanRivals();
      await this.gatherNews();
      await this.generateCodeSamples();
      await this.writeReport();
      await this.createZip();

      console.log('\n✅ Daily analysis complete!');
      console.log(`📄 Report: ${REPORT_PATH}`);
      console.log(`📦 Updates: ${ZIP_PATH}`);
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }

  async analyzeRepository() {
    console.log('📊 Analyzing repository structure...');

    const stats = {
      totalFiles: 0,
      totalLines: 0,
      fileTypes: {},
      directories: new Set(),
      recentChanges: []
    };

    const walkDir = (dir, depth = 0) => {
      if (depth > 3) return; // Limit depth
      
      const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage'];
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!skipDirs.includes(entry.name)) {
              stats.directories.add(entry.name);
              walkDir(fullPath, depth + 1);
            }
          } else if (entry.isFile()) {
            stats.totalFiles++;
            const ext = path.extname(entry.name);
            stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
            
            // Count lines for text files
            if (['.ts', '.js', '.tsx', '.jsx', '.md', '.json'].includes(ext)) {
              try {
                const content = fs.readFileSync(fullPath, 'utf8');
                stats.totalLines += content.split('\n').length;
              } catch (e) {
                // Skip files that can't be read
              }
            }
          }
        }
      } catch (err) {
        // Skip directories we can't read
      }
    };

    walkDir(REPO_ROOT);

    this.report.sections.push({
      title: 'Repository Deep Dive',
      data: stats,
      summary: `Analyzed ${stats.totalFiles} files across ${stats.directories.size} directories with ${stats.totalLines.toLocaleString()} lines of code.`
    });

    console.log(`  ✓ Found ${stats.totalFiles} files, ${stats.totalLines.toLocaleString()} lines`);
  }

  async scanRivals() {
    console.log('🔍 Scanning rival repositories...');

    const rivalData = [];

    for (const repo of config.competitors) {
      try {
        const [owner, name] = repo.split('/');
        
        const headers = {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Milla-Rayne-Empire-Bot'
        };
        
        if (config.githubToken) {
          headers['Authorization'] = `Bearer ${config.githubToken}`;
        }

        // Get repository info
        const repoResponse = await axios.get(
          `https://api.github.com/repos/${owner}/${name}`,
          { headers, timeout: 10000 }
        );

        // Get recent commits
        const commitsResponse = await axios.get(
          `https://api.github.com/repos/${owner}/${name}/commits?per_page=5`,
          { headers, timeout: 10000 }
        );

        const repoInfo = repoResponse.data;
        const commits = commitsResponse.data;

        rivalData.push({
          name: repo,
          stars: repoInfo.stargazers_count,
          forks: repoInfo.forks_count,
          openIssues: repoInfo.open_issues_count,
          lastUpdate: repoInfo.updated_at,
          language: repoInfo.language,
          recentCommits: commits.length,
          lastCommitDate: commits[0]?.commit?.author?.date || 'N/A',
          description: repoInfo.description
        });

        console.log(`  ✓ ${repo}: ${repoInfo.stargazers_count} ⭐`);

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`  ⚠️  ${repo}: ${error.message}`);
        rivalData.push({
          name: repo,
          error: error.message
        });
      }
    }

    this.report.sections.push({
      title: 'GitHub Rival Scan',
      data: rivalData,
      summary: `Scanned ${config.competitors.length} rival repositories. Top performer: ${rivalData.sort((a, b) => (b.stars || 0) - (a.stars || 0))[0]?.name || 'N/A'}`
    });
  }

  async gatherNews() {
    console.log('📰 Gathering news intelligence...');

    const newsItems = [];

    try {
      // Fetch Google News for AI-related topics
      const searchQuery = encodeURIComponent('AI assistant conversational');
      const newsUrl = `https://news.google.com/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`;

      const response = await axios.get(newsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Parse news articles (structure may vary)
      $('article, .xrnccd').slice(0, 10).each((i, elem) => {
        const $elem = $(elem);
        const title = $elem.find('h3, h4, a').first().text().trim();
        const link = $elem.find('a').first().attr('href');
        const source = $elem.find('.wEwyrc, .vr1PYe').text().trim();

        if (title && title.length > 10) {
          newsItems.push({
            title,
            source: source || 'Unknown',
            link: link ? `https://news.google.com${link}` : null,
            relevance: this.calculateRelevance(title)
          });
        }
      });

      console.log(`  ✓ Found ${newsItems.length} news items`);
    } catch (error) {
      console.log(`  ⚠️  News gathering failed: ${error.message}`);
      newsItems.push({
        title: 'News scraping temporarily unavailable',
        error: error.message
      });
    }

    this.report.sections.push({
      title: 'News Intelligence',
      data: newsItems.slice(0, 10),
      summary: `Gathered ${newsItems.length} relevant news items from the AI ecosystem.`
    });
  }

  calculateRelevance(title) {
    const keywords = ['AI', 'LLM', 'assistant', 'chatbot', 'GPT', 'machine learning', 'conversational'];
    const lowerTitle = title.toLowerCase();
    return keywords.filter(kw => lowerTitle.includes(kw.toLowerCase())).length;
  }

  async generateCodeSamples() {
    console.log('💻 Generating code samples...');

    // Create generated directory
    if (!fs.existsSync(GENERATED_DIR)) {
      fs.mkdirSync(GENERATED_DIR, { recursive: true });
    }

    // Generate dispatcher.ts
    const dispatcherCode = `// Auto-generated Dispatcher - ${new Date().toISOString()}

export interface Task {
  id: string;
  type: 'analysis' | 'report' | 'notification';
  priority: number;
  payload: unknown;
  timestamp: Date;
}

export class EmpireDispatcher {
  private queue: Task[] = [];
  private processing = false;

  async dispatch(task: Task): Promise<void> {
    this.queue.push(task);
    this.queue.sort((a, b) => b.priority - a.priority);
    
    if (!this.processing) {
      await this.process();
    }
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;

      console.log(\`Processing task: \${task.id}\`);
      
      switch (task.type) {
        case 'analysis':
          await this.handleAnalysis(task);
          break;
        case 'report':
          await this.handleReport(task);
          break;
        case 'notification':
          await this.handleNotification(task);
          break;
      }
    }

    this.processing = false;
  }

  private async handleAnalysis(task: Task): Promise<void> {
    // Implement analysis logic
  }

  private async handleReport(task: Task): Promise<void> {
    // Implement report generation
  }

  private async handleNotification(task: Task): Promise<void> {
    // Implement notification logic
  }
}
`;

    fs.writeFileSync(path.join(GENERATED_DIR, 'dispatcher.ts'), dispatcherCode);

    // Generate intelligence-gatherer.ts
    const gathererCode = `// Auto-generated Intelligence Gatherer - ${new Date().toISOString()}

import axios from 'axios';

export interface IntelligenceSource {
  name: string;
  url: string;
  type: 'github' | 'news' | 'social' | 'technical';
  priority: number;
}

export class IntelligenceGatherer {
  private sources: IntelligenceSource[] = [];

  addSource(source: IntelligenceSource): void {
    this.sources.push(source);
  }

  async gather(): Promise<Map<string, unknown>> {
    const results = new Map<string, unknown>();

    for (const source of this.sources) {
      try {
        const data = await this.fetchSource(source);
        results.set(source.name, data);
      } catch (error) {
        console.error(\`Failed to gather from \${source.name}:\`, error);
        results.set(source.name, { error: error.message });
      }
    }

    return results;
  }

  private async fetchSource(source: IntelligenceSource): Promise<unknown> {
    const response = await axios.get(source.url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Milla-Rayne-Intelligence' }
    });

    return this.parseResponse(response.data, source.type);
  }

  private parseResponse(data: unknown, type: string): unknown {
    // Implement parsing logic based on source type
    return data;
  }
}
`;

    fs.writeFileSync(path.join(GENERATED_DIR, 'intelligence-gatherer.ts'), gathererCode);

    // Generate analysis-config.json
    const configData = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      settings: {
        analysisFrequency: 'daily',
        reportFormat: 'markdown',
        notificationChannels: ['email'],
        dataRetention: 30,
        competitors: config.competitors,
        monitoringEnabled: true
      },
      thresholds: {
        starGrowthAlert: 100,
        issueCountAlert: 50,
        commitFrequencyAlert: 10
      }
    };

    fs.writeFileSync(
      path.join(GENERATED_DIR, 'analysis-config.json'),
      JSON.stringify(configData, null, 2)
    );

    // Generate README
    const readmeContent = `# Daily Empire Analysis - Generated Files

**Generated:** ${new Date().toISOString()}

## Contents

- \`dispatcher.ts\` - Task dispatching and priority queue system
- \`intelligence-gatherer.ts\` - Multi-source intelligence gathering
- \`analysis-config.json\` - Configuration for analysis system

## Usage

\`\`\`typescript
import { EmpireDispatcher } from './dispatcher';
import { IntelligenceGatherer } from './intelligence-gatherer';

const dispatcher = new EmpireDispatcher();
const gatherer = new IntelligenceGatherer();

// Add your implementation
\`\`\`

## Notes

These files are auto-generated by the Daily Empire workflow.
Customize as needed for your empire building operations.
`;

    fs.writeFileSync(path.join(GENERATED_DIR, 'README.md'), readmeContent);

    console.log('  ✓ Generated 4 files in generated/');
  }

  async writeReport() {
    console.log('📝 Writing report...');

    let markdown = `# Daily Empire Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST\n\n`;
    markdown += `---\n\n`;

    for (const section of this.report.sections) {
      markdown += `## ${section.title}\n\n`;
      markdown += `${section.summary}\n\n`;

      if (section.title === 'Repository Deep Dive') {
        const stats = section.data;
        markdown += `### Statistics\n\n`;
        markdown += `- **Total Files:** ${stats.totalFiles}\n`;
        markdown += `- **Total Lines:** ${stats.totalLines.toLocaleString()}\n`;
        markdown += `- **Directories:** ${stats.directories.size}\n\n`;
        
        markdown += `### File Types\n\n`;
        const sortedTypes = Object.entries(stats.fileTypes)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);
        
        for (const [ext, count] of sortedTypes) {
          markdown += `- ${ext || 'no extension'}: ${count} files\n`;
        }
        markdown += `\n`;
      }

      if (section.title === 'GitHub Rival Scan') {
        markdown += `### Competitor Analysis\n\n`;
        markdown += `| Repository | Stars | Forks | Open Issues | Last Commit |\n`;
        markdown += `|------------|-------|-------|-------------|-------------|\n`;
        
        for (const rival of section.data) {
          if (rival.error) {
            markdown += `| ${rival.name} | ❌ Error | - | - | - |\n`;
          } else {
            markdown += `| ${rival.name} | ${rival.stars?.toLocaleString() || 'N/A'} ⭐ | ${rival.forks?.toLocaleString() || 'N/A'} | ${rival.openIssues || 'N/A'} | ${rival.lastCommitDate?.split('T')[0] || 'N/A'} |\n`;
          }
        }
        markdown += `\n`;
      }

      if (section.title === 'News Intelligence') {
        markdown += `### Top Headlines\n\n`;
        const topNews = section.data.slice(0, 10);
        
        for (let i = 0; i < topNews.length; i++) {
          const item = topNews[i];
          if (item.error) {
            markdown += `${i + 1}. ⚠️ ${item.title}\n`;
          } else {
            markdown += `${i + 1}. **${item.title}**\n`;
            if (item.source) markdown += `   - Source: ${item.source}\n`;
            if (item.relevance) markdown += `   - Relevance Score: ${item.relevance}/5\n`;
          }
          markdown += `\n`;
        }
      }

      markdown += `---\n\n`;
    }

    markdown += `## Generated Artifacts\n\n`;
    markdown += `The following files were generated:\n\n`;
    markdown += `- \`dispatcher.ts\` - Task dispatching system\n`;
    markdown += `- \`intelligence-gatherer.ts\` - Data collection framework\n`;
    markdown += `- \`analysis-config.json\` - Configuration file\n`;
    markdown += `- \`README.md\` - Documentation\n\n`;

    markdown += `---\n\n`;
    markdown += `*Automated by Milla-Rayne Daily Empire*\n`;

    fs.writeFileSync(REPORT_PATH, markdown);
    console.log(`  ✓ Report written to ${REPORT_PATH}`);
  }

  async createZip() {
    console.log('📦 Creating updates.zip...');

    const zip = new AdmZip();
    
    // Add all files from generated directory
    const files = fs.readdirSync(GENERATED_DIR);
    for (const file of files) {
      const filePath = path.join(GENERATED_DIR, file);
      zip.addLocalFile(filePath);
    }

    zip.writeZip(ZIP_PATH);
    console.log(`  ✓ Zip created with ${files.length} files`);
  }
}

// Execute
const analyzer = new DailyAnalyzer();
analyzer.run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

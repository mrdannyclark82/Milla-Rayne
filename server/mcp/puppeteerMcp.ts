/**
 * Puppeteer MCP Service
 * Browser automation through MCP protocol
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { config } from '../config.js';

export interface ScreenshotOptions {
  fullPage?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg';
}

export interface PageContent {
  html: string;
  text: string;
  title: string;
  url: string;
}

export class PuppeteerMCPService {
  private browser: Browser | null = null;
  private headless: boolean;

  constructor() {
    this.headless = config.mcp?.puppeteer?.headless !== false;
  }

  /**
   * Get or create browser instance
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  /**
   * Take a screenshot of a URL
   */
  async screenshot(url: string, options: ScreenshotOptions = {}): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const screenshot = await page.screenshot({
        fullPage: options.fullPage ?? true,
        type: options.type || 'png',
        ...(options.type === 'jpeg' && { quality: options.quality || 80 }),
      });

      return screenshot as Buffer;
    } finally {
      await page.close();
    }
  }

  /**
   * Navigate to a URL and extract content
   */
  async extractContent(url: string): Promise<PageContent> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const content = await page.evaluate(() => ({
        html: document.documentElement.outerHTML,
        text: document.body.innerText,
        title: document.title,
        url: window.location.href,
      }));

      return content;
    } finally {
      await page.close();
    }
  }

  /**
   * Click an element on a page
   */
  async click(url: string, selector: string): Promise<void> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector(selector);
      await page.click(selector);
      await page.waitForTimeout(1000); // Wait for any actions to complete
    } finally {
      await page.close();
    }
  }

  /**
   * Type text into an input field
   */
  async type(url: string, selector: string, text: string): Promise<void> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector(selector);
      await page.type(selector, text);
    } finally {
      await page.close();
    }
  }

  /**
   * Execute custom JavaScript on a page
   */
  async evaluate<T>(url: string, script: string): Promise<T> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      const result = await page.evaluate(script);
      return result as T;
    } finally {
      await page.close();
    }
  }

  /**
   * Get all links from a page
   */
  async getLinks(url: string): Promise<string[]> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      const links = await page.evaluate(() => 
        Array.from(document.querySelectorAll('a[href]'))
          .map(a => (a as HTMLAnchorElement).href)
      );

      return links;
    } finally {
      await page.close();
    }
  }

  /**
   * Fill a form
   */
  async fillForm(url: string, formData: Record<string, string>): Promise<void> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      for (const [selector, value] of Object.entries(formData)) {
        await page.waitForSelector(selector);
        await page.type(selector, value);
      }
    } finally {
      await page.close();
    }
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

let puppeteerService: PuppeteerMCPService | null = null;

export function getPuppeteerMCPService(): PuppeteerMCPService {
  if (!puppeteerService) {
    puppeteerService = new PuppeteerMCPService();
  }
  return puppeteerService;
}

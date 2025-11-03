import { vi } from 'vitest';

class MockResponse {
  private body: any;
  private options: any;

  constructor(body: any, options: any) {
    this.body = body;
    this.options = options;
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }

  text() {
    return Promise.resolve(this.body);
  }

  get status() {
    return this.options.status;
  }
}

export default vi.fn();
export { MockResponse as Response };
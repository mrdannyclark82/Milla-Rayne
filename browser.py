import asyncio
from playwright.async_api import async_playwright

class BrowserAgentTool:
    """
    A tool for AI assistants to interact with a web browser.

    This class provides core browser functionalities like navigating to a URL,
    extracting page content, clicking elements, and filling out forms. It is
    designed to be used by an AI agent that can call these methods as tools.

    Prerequisites:
    - Install the playwright library: pip install playwright
    - Install browser binaries: playwright install
    """
    def __init__(self):
        """Initializes the browser context."""
        self.playwright = None
        self.browser = None
        self.page = None

    async def initialize(self):
        """
        Launches the browser and creates a new page.
        This method should be called once before any other method.
        """
        self.playwright = await async_playwright().start()
        # Use headless=True for running in the background without a UI
        self.browser = await self.playwright.chromium.launch(headless=True)
        self.page = await self.browser.new_page()

    async def cleanup(self):
        """Closes the browser instance."""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def go_to_url(self, url: str) -> str:
        """
        Navigates the browser to the specified URL.

        Args:
            url: The URL to navigate to.

        Returns:
            A string indicating success or failure.
        """
        try:
            print(f"Navigating to {url}...")
            await self.page.goto(url)
            print(f"Successfully navigated to {url}.")
            return f"Successfully navigated to {url}. The current page title is: '{await self.page.title()}'"
        except Exception as e:
            print(f"Failed to navigate to {url}. Error: {e}")
            return f"Failed to navigate to {url}. Error: {e}"

    async def get_page_content(self) -> str:
        """
        Retrieves the full HTML content of the current page.

        Returns:
            The HTML content of the page as a string.
        """
        print("Getting page content...")
        return await self.page.content()

    async def get_page_text(self) -> str:
        """
        Retrieves the text content of the current page's body.

        Returns:
            The text content of the page as a string.
        """
        print("Getting page text content...")
        return await self.page.text_content('body')

    async def get_elements_by_selector(self, selector: str) -> str:
        """
        Finds elements on the page using a CSS selector and returns
        their inner text and attributes.

        Args:
            selector: A CSS selector (e.g., 'a', '#main-content', '.product-title').

        Returns:
            A string with a formatted list of found elements and their details.
        """
        try:
            elements = await self.page.query_selector_all(selector)
            if not elements:
                return f"No elements found with selector: '{selector}'"

            result = f"Found {len(elements)} elements with selector '{selector}':\n"
            for i, element in enumerate(elements):
                text = await element.inner_text()
                tag_name = await element.evaluate("el => el.tagName")
                attributes = await element.evaluate("el => { "
                                                    "const attrs = {}; "
                                                    "for (const attr of el.attributes) { "
                                                    "    attrs[attr.name] = attr.value; "
                                                    "} "
                                                    "return attrs; "
                                                    "}")
                result += f"--- Element {i+1} ---\n"
                result += f"Tag: {tag_name}\n"
                result += f"Text: {text.strip()}\n"
                result += f"Attributes: {attributes}\n\n"
            return result
        except Exception as e:
            return f"An error occurred while getting elements: {e}"

    async def click_element(self, selector: str) -> str:
        """
        Clicks on a single element identified by a CSS selector.

        Args:
            selector: The CSS selector of the element to click.

        Returns:
            A string indicating the outcome of the action.
        """
        print(f"Attempting to click element with selector: '{selector}'...")
        try:
            # Waits for the element to be visible before clicking
            await self.page.locator(selector).click(timeout=5000)
            return f"Successfully clicked the element with selector '{selector}'."
        except Exception as e:
            return f"Failed to click the element with selector '{selector}'. Error: {e}"

    async def fill_form(self, selector: str, value: str) -> str:
        """
        Fills a form input field with the specified value.

        Args:
            selector: The CSS selector of the input field.
            value: The string value to enter into the field.

        Returns:
            A string indicating the outcome of the action.
        """
        print(f"Attempting to fill element with selector '{selector}' with value '{value}'...")
        try:
            # Waits for the element to be enabled before filling
            await self.page.locator(selector).fill(value, timeout=5000)
            return f"Successfully filled the element with selector '{selector}'."
        except Exception as e:
            return f"Failed to fill the element with selector '{selector}'. Error: {e}"

# Example of how the tool could be used by an AI assistant
async def main():
    """Demonstrates how to use the BrowserAgentTool class."""
    browser_tool = BrowserAgentTool()

    try:
        # 1. Initialize the tool
        await browser_tool.initialize()

        # 2. Go to a URL
        print(await browser_tool.go_to_url('https://en.wikipedia.org/wiki/Python_(programming_language)'))

        # 3. Get text content from a specific section
        python_text = await browser_tool.get_elements_by_selector('#History')
        print("--- HISTORY SECTION ---")
        print(python_text)

        # 4. Use the content to generate a summary with the help of a language model.
        #    This is where your AI assistant would take over. For example:
        #    llm_response = your_llm_model.generate(prompt=f"Summarize this text: {python_text}")
        #    print(llm_response)

        # 5. Navigate to a different page (e.g., search page)
        print(await browser_tool.go_to_url('https://www.google.com'))

        # 6. Fill a search bar and press enter
        #    The AI would first need to find the correct selector for the search bar
        print(await browser_tool.fill_form('textarea[name="q"]', 'AI and browser automation'))

        # 7. Press the search button or hit Enter (not shown for brevity)

    finally:
        # 8. Clean up and close the browser
        await browser_tool.cleanup()

if __name__ == '__main__':
    # Run the main asynchronous function
    asyncio.run(main())

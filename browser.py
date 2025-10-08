import asyncio
import sys
import json
import os
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
    def __init__(self, headless: bool = True, access_token: str = None):
        """Initializes the browser context.

        Args:
            headless: Whether to run the browser in headless mode (default: True).
            access_token: Google OAuth access token for authenticated browsing (optional).
        """
        self.headless = headless
        self.access_token = access_token
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
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        
        # Create browser context with optional authentication
        context_options = {}
        if self.access_token:
            # Add Google OAuth cookie/token for authenticated browsing
            context_options['storage_state'] = None  # We'll set cookies after page creation
        
        self.context = await self.browser.new_context(**context_options)
        self.page = await self.context.new_page()
        
        # If access token is provided, set it as a cookie for Google domains
        if self.access_token:
            await self._set_google_auth()

    async def cleanup(self):
        """Closes the browser instance."""
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def _set_google_auth(self):
        """Set Google OAuth authentication using access token."""
        try:
            # Navigate to Google to set up authentication
            await self.page.goto('https://accounts.google.com')
            
            # Set the access token in local storage for Google services
            await self.page.evaluate(f"""
                localStorage.setItem('google_access_token', '{self.access_token}');
            """)
            
            # Set cookies for authenticated session
            await self.context.add_cookies([
                {
                    'name': 'oauth_token',
                    'value': self.access_token,
                    'domain': '.google.com',
                    'path': '/',
                    'secure': True,
                    'httpOnly': False
                }
            ])
            
            print("[Browser] Google authentication configured with access token")
        except Exception as e:
            print(f"[Browser] Warning: Could not set Google auth: {e}")
    
    async def add_calendar_event(self, title: str, date: str, time: str = None, description: str = None) -> dict:
        """
        Add an event to Google Calendar using the authenticated browser.
        
        Args:
            title: Event title
            date: Event date (e.g., "2025-01-15")
            time: Optional event time (e.g., "14:00")
            description: Optional event description
            
        Returns:
            Dictionary with success status and message
        """
        try:
            if not self.access_token:
                return {
                    "success": False,
                    "message": "Authentication required. Please provide a Google OAuth access token."
                }
            
            print(f"[Browser] Adding calendar event: {title} on {date}")
            
            # Navigate to Google Calendar
            await self.page.goto('https://calendar.google.com')
            await self.page.wait_for_load_state('networkidle')
            
            # Wait for calendar to load
            await self.page.wait_for_timeout(2000)
            
            # Click create button
            create_button = await self.page.query_selector('[aria-label="Create"]')
            if create_button:
                await create_button.click()
            else:
                # Try alternative selectors
                await self.page.click('button:has-text("Create")')
            
            await self.page.wait_for_timeout(1000)
            
            # Click "Event" option
            await self.page.click('text=Event')
            
            # Fill in event details
            await self.page.fill('input[aria-label="Add title"]', title)
            
            if description:
                await self.page.fill('textarea[aria-label="Description"]', description)
            
            # Save the event
            await self.page.click('button:has-text("Save")')
            
            await self.page.wait_for_timeout(2000)
            
            return {
                "success": True,
                "message": f"Successfully added calendar event: {title}",
                "data": {"title": title, "date": date, "time": time}
            }
            
        except Exception as e:
            print(f"[Browser] Error adding calendar event: {e}")
            return {
                "success": False,
                "message": f"Failed to add calendar event: {str(e)}",
                "error": str(e)
            }
    
    async def add_note_to_keep(self, title: str, content: str) -> dict:
        """
        Add a note to Google Keep using the authenticated browser.
        
        Args:
            title: Note title
            content: Note content
            
        Returns:
            Dictionary with success status and message
        """
        try:
            if not self.access_token:
                return {
                    "success": False,
                    "message": "Authentication required. Please provide a Google OAuth access token."
                }
            
            print(f"[Browser] Adding note to Keep: {title}")
            
            # Navigate to Google Keep
            await self.page.goto('https://keep.google.com')
            await self.page.wait_for_load_state('networkidle')
            
            # Wait for Keep to load
            await self.page.wait_for_timeout(2000)
            
            # Click to create a new note
            new_note = await self.page.query_selector('[aria-label="Take a note..."]')
            if new_note:
                await new_note.click()
            else:
                await self.page.click('text=Take a note')
            
            await self.page.wait_for_timeout(500)
            
            # Fill in note title and content
            await self.page.fill('input[aria-label="Title"]', title)
            await self.page.fill('div[aria-label="Take a note..."]', content)
            
            # Click close to save
            await self.page.click('[aria-label="Close"]')
            
            await self.page.wait_for_timeout(1000)
            
            return {
                "success": True,
                "message": f"Successfully added note to Keep: {title}",
                "data": {"title": title, "content": content}
            }
            
        except Exception as e:
            print(f"[Browser] Error adding note to Keep: {e}")
            return {
                "success": False,
                "message": f"Failed to add note to Keep: {str(e)}",
                "error": str(e)
            }

    async def go_to_url(self, url: str) -> str:
        """
        Navigates the browser to the specified URL.

        Args:
            url: The URL to navigate to.

        Returns:
            A string indicating success or failure.
        """
        try:
            if self.page is None:
                error_msg = "Browser page is not initialized. Call 'initialize()' before using this method."
                print(error_msg)
                return error_msg
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
        if self.page is None:
            error_msg = "Browser page is not initialized. Call 'initialize()' before using this method."
            print(error_msg)
            return error_msg
        return await self.page.content()

    async def get_page_text(self) -> str:
        """
        Retrieves the text content of the current page's body.

        Returns:
            The text content of the page as a string.
        """
        print("Getting page text content...")
        if self.page is None:
            error_msg = "Browser page is not initialized. Call 'initialize()' before using this method."
            print(error_msg)
            return error_msg
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
            if self.page is None:
                error_msg = "Browser page is not initialized. Call 'initialize()' before using this method."
                print(error_msg)
                return error_msg
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
        if self.page is None:
            error_msg = "Browser page is not initialized. Call 'initialize()' before using this method."
            print(error_msg)
            return error_msg
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
        if self.page is None:
            error_msg = "Browser page is not initialized. Call 'initialize()' before using this method."
            print(error_msg)
            return error_msg
        try:
            # Waits for the element to be enabled before filling
            await self.page.locator(selector).fill(value, timeout=5000)
            return f"Successfully filled the element with selector '{selector}'."
        except Exception as e:
            return f"Failed to fill the element with selector '{selector}'. Error: {e}"

# Command-line interface for browser automation
async def execute_action(action: str, params: dict, access_token: str = None):
    """
    Execute a browser action from command line.
    
    Args:
        action: Action to perform (navigate, add_calendar_event, add_note)
        params: Parameters for the action
        access_token: Optional Google OAuth access token
        
    Returns:
        Result dictionary with success status and message
    """
    browser_tool = BrowserAgentTool(headless=True, access_token=access_token)
    
    try:
        await browser_tool.initialize()
        
        if action == 'navigate':
            url = params.get('url')
            if not url:
                return {"success": False, "message": "URL parameter required"}
            result = await browser_tool.go_to_url(url)
            return {"success": True, "message": result}
            
        elif action == 'add_calendar_event':
            title = params.get('title')
            date = params.get('date')
            time = params.get('time')
            description = params.get('description')
            
            if not title or not date:
                return {"success": False, "message": "Title and date parameters required"}
            
            return await browser_tool.add_calendar_event(title, date, time, description)
            
        elif action == 'add_note':
            title = params.get('title')
            content = params.get('content')
            
            if not title or not content:
                return {"success": False, "message": "Title and content parameters required"}
            
            return await browser_tool.add_note_to_keep(title, content)
            
        else:
            return {"success": False, "message": f"Unknown action: {action}"}
            
    except Exception as e:
        return {"success": False, "message": f"Error executing action: {str(e)}", "error": str(e)}
    finally:
        await browser_tool.cleanup()

# Example of how the tool could be used by an AI assistant
async def main():
    """Demonstrates how to use the BrowserAgentTool class."""
    # Check if running as CLI tool
    if len(sys.argv) > 1:
        # CLI mode: python3 browser.py <action> <params_json>
        action = sys.argv[1]
        params = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        access_token = os.environ.get('GOOGLE_ACCESS_TOKEN')
        
        result = await execute_action(action, params, access_token)
        print(json.dumps(result))
        return
    
    # Demo mode
    browser_tool = BrowserAgentTool(headless=True)  # Set headless=False for debugging with UI

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

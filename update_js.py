import re

with open(".local/state/replit/agent/design_reference/1bb67683-95f1-4724-b7df-1e1333e18257/603df094-e87c-4ddd-ad24-c107aa8d69ae.html", "r") as f:
    content = f.read()

# Make the personality matrix items clickable
original_js_start = """      (function () {
        // Basic mockup interactions - replace with React implementation
        const textarea = document.querySelector('textarea');
        const sendButton = document.querySelector(
          'button[data-event="click:handleSendMessage"]'
        );
        const wordCountSpan = document.querySelector('[data-bind="wordCount"]');"""

new_js_start = """      (function () {
        // Basic mockup interactions - replace with React implementation
        const textarea = document.querySelector('textarea');
        const sendButton = document.querySelector(
          'button[data-event="click:handleSendMessage"]'
        );
        const wordCountSpan = document.querySelector('[data-bind="wordCount"]');

        // AI Personality switching logic
        let currentPersonality = 'coach';
        const personalityOptions = document.querySelectorAll('.personality-option');

        personalityOptions.forEach(option => {
          option.addEventListener('click', function() {
            // Update state
            currentPersonality = this.getAttribute('data-personality');

            // Update UI
            personalityOptions.forEach(opt => {
              const indicator = opt.querySelector('.personality-indicator');
              if (opt === this) {
                // Active state
                opt.classList.add('text-foreground');
                indicator.classList.remove('bg-muted');
                indicator.classList.add('bg-green-500');
              } else {
                // Inactive state
                opt.classList.remove('text-foreground');
                indicator.classList.remove('bg-green-500');
                indicator.classList.add('bg-muted');
              }
            });

            console.log('Personality switched to:', currentPersonality);
          });
        });"""

content = content.replace(original_js_start, new_js_start)

# Update textarea keydown event log
original_keydown_log = """              // TODO: Implement message sending logic
              console.log('Send message:', this.value);
              this.value = '';"""

new_keydown_log = """              // TODO: Implement message sending logic
              console.log(`[${currentPersonality.toUpperCase()}] Send message:`, this.value);
              this.value = '';"""

content = content.replace(original_keydown_log, new_keydown_log)

# Update send button click event log
original_click_log = """              // TODO: Implement message sending logic
              console.log('Send message:', textarea.value);
              textarea.value = '';"""

new_click_log = """              // TODO: Implement message sending logic
              console.log(`[${currentPersonality.toUpperCase()}] Send message:`, textarea.value);
              textarea.value = '';"""

content = content.replace(original_click_log, new_click_log)


with open(".local/state/replit/agent/design_reference/1bb67683-95f1-4724-b7df-1e1333e18257/603df094-e87c-4ddd-ad24-c107aa8d69ae.html", "w") as f:
    f.write(content)
print("Success")

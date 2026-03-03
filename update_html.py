import re

with open(".local/state/replit/agent/design_reference/1bb67683-95f1-4724-b7df-1e1333e18257/603df094-e87c-4ddd-ad24-c107aa8d69ae.html", "r") as f:
    content = f.read()

# Make the personality matrix items clickable
replacement = """
                <div class="flex items-center justify-between cursor-pointer hover:text-foreground transition-colors personality-option" data-personality="coach">
                  <span>Coach Mode</span>
                  <div class="w-2 h-2 bg-green-500 rounded-full personality-indicator"></div>
                </div>
                <div class="flex items-center justify-between cursor-pointer hover:text-foreground transition-colors personality-option" data-personality="empathetic">
                  <span>Empathetic Listener</span>
                  <div class="w-2 h-2 bg-muted rounded-full personality-indicator"></div>
                </div>
                <div class="flex items-center justify-between cursor-pointer hover:text-foreground transition-colors personality-option" data-personality="strategic">
                  <span>Strategic Advisor</span>
                  <div class="w-2 h-2 bg-muted rounded-full personality-indicator"></div>
                </div>
                <div class="flex items-center justify-between cursor-pointer hover:text-foreground transition-colors personality-option" data-personality="creative">
                  <span>Creative Partner</span>
                  <div class="w-2 h-2 bg-muted rounded-full personality-indicator"></div>
                </div>
"""

original = """
                <div class="flex items-center justify-between">
                  <span>Coach Mode</span>
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div class="flex items-center justify-between">
                  <span>Empathetic Listener</span>
                  <div class="w-2 h-2 bg-muted rounded-full"></div>
                </div>
                <div class="flex items-center justify-between">
                  <span>Strategic Advisor</span>
                  <div class="w-2 h-2 bg-muted rounded-full"></div>
                </div>
                <div class="flex items-center justify-between">
                  <span>Creative Partner</span>
                  <div class="w-2 h-2 bg-muted rounded-full"></div>
                </div>
"""

if original.strip() in content:
    content = content.replace(original.strip(), replacement.strip())
    with open(".local/state/replit/agent/design_reference/1bb67683-95f1-4724-b7df-1e1333e18257/603df094-e87c-4ddd-ad24-c107aa8d69ae.html", "w") as f:
        f.write(content)
    print("Success")
else:
    print("Original string not found")

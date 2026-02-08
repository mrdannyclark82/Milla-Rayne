import re

file_path = 'server/agents/codingAgent.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Find the generate_fix case
pattern_str = r"(\s+case 'generate_fix':\s+return await this\.generateCodeFix\(task\.payload\?\.issue\);)"

replacement_str = """
      case 'generate_fix':
        return await this.generateCodeFix(task.payload?.issue);

      case 'self_correct':
        return await generateFix(
          task.payload?.originalError || {
            error: task.payload?.description || 'Unknown SCPA error',
            agentName: 'unknown',
          }
        );"""

# Use re.sub
content = re.sub(pattern_str, replacement_str, content, count=1)

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully updated handleTask in server/agents/codingAgent.ts")

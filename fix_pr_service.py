file_path = 'server/automatedPRService.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Fix the empty Error
content = content.replace(
    "throw new Error(\n          \n        );",
    "throw new Error(\n          `Branch ${prRequest.branch} does not exist and commit is skipped`\n        );"
)

with open(file_path, 'w') as f:
    f.write(content)

print("Fixed server/automatedPRService.ts")

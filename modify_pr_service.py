import re

file_path = 'server/automatedPRService.ts'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Update PRRequest interface
content = content.replace(
    "  files: string[];\n  createdAt: number;",
    "  files: string[];\n  skipCommit?: boolean;\n  createdAt: number;"
)

# 2. Update createPRForSandbox signature in class
content = content.replace(
    "    branch: string;\n    files: string[];\n  }): Promise<PRRequest> {",
    "    branch: string;\n    files: string[];\n    skipCommit?: boolean;\n  }): Promise<PRRequest> {"
)

# 3. Update createPRForSandbox implementation in class
# This one is tricky because indentation might vary. Let's look for the object literal.
content = content.replace(
    "      baseBranch: 'main',\n      files: params.files,\n      createdAt: Date.now(),",
    "      baseBranch: 'main',\n      files: params.files,\n      skipCommit: params.skipCommit,\n      createdAt: Date.now(),"
)

# 4. Update processPRCreation logic
# We use regex to find the block and replace it.
pattern_str = r"(\s+// Create branch if it doesn't exist\s+const branchExists = await this\.checkBranchExists\(prRequest\.branch\);\s+if \(!branchExists\) \{\s+await this\.createBranch\(prRequest\.branch, prRequest\.baseBranch\);\s+\}\s+// Commit changes to branch\s+await this\.commitChangesToBranch\(\s+prRequest\.branch,\s+prRequest\.files,\s+prRequest\.title\s+\);)"

# The indentation in the replacement string must match the file.
replacement_str = """
      // Create branch if it doesn't exist
      const branchExists = await this.checkBranchExists(prRequest.branch);
      if (!branchExists && !prRequest.skipCommit) {
        await this.createBranch(prRequest.branch, prRequest.baseBranch);
      } else if (!branchExists && prRequest.skipCommit) {
        throw new Error(
          `Branch ${prRequest.branch} does not exist and commit is skipped`
        );
      }

      // Commit changes to branch
      if (!prRequest.skipCommit) {
        await this.commitChangesToBranch(
          prRequest.branch,
          prRequest.files,
          prRequest.title
        );
      }"""

# Use re.sub
content = re.sub(pattern_str, replacement_str, content, count=1, flags=re.MULTILINE|re.DOTALL)

# 5. Update exported function signature
content = content.replace(
    "  branch: string;\n  files: string[];\n}): Promise<PRRequest> {",
    "  branch: string;\n  files: string[];\n  skipCommit?: boolean;\n}): Promise<PRRequest> {"
)

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully modified server/automatedPRService.ts")

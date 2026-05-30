import re

file_path = 'server/agents/codingAgent.ts'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Add imports
# Check if child_process is already imported (unlikely based on read_file)
if "child_process" not in content:
    content = "import { exec } from 'child_process';\nimport { promisify } from 'util';\nconst execAsync = promisify(exec);\n" + content

# 2. Add getSandbox to imports from sandboxEnvironmentService
content = content.replace(
    "  markSandboxForMerge,",
    "  markSandboxForMerge,\n  getSandbox,"
)

# 3. Add applyPatchToSandbox function
# I'll place it before applyFixToCodebase
helper_func = """
/**
 * Helper to apply patch to a sandbox branch
 */
async function applyPatchToSandbox(sandboxId: string, patch: { files: string[]; changes: string }): Promise<boolean> {
  const sandbox = getSandbox(sandboxId);
  if (!sandbox) {
    console.error(`Sandbox ${sandboxId} not found`);
    return false;
  }

  const branchName = sandbox.branchName;
  let currentBranch = '';

  try {
    // Get current branch
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD');
    currentBranch = stdout.trim();

    // Checkout sandbox branch
    console.log(`Checking out sandbox branch: ${branchName}`);
    await execAsync(`git checkout ${branchName}`);

    // Apply patch
    // Re-using applyFixToCodebase logic but inside the branch context
    // Note: applyFixToCodebase uses fs.readFile/writeFile which works on current working directory (which is now switched)
    const success = await applyFixToCodebase(patch);

    if (!success) {
      throw new Error('Failed to apply fix to codebase');
    }

    // Commit changes
    await execAsync('git add .');
    await execAsync('git commit -m "Apply SCPA automated fix"');

    // Push changes
    await execAsync(`git push -u origin ${branchName}`);

    console.log(`✅ Applied patch to sandbox branch ${branchName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error applying patch to sandbox: ${error}`);
    // Attempt to reset
    try {
        await execAsync('git checkout .');
        await execAsync('git clean -fd');
    } catch (e) { /* ignore */ }
    return false;
  } finally {
    // Switch back to original branch
    if (currentBranch && currentBranch !== branchName) {
      try {
        console.log(`Switching back to original branch: ${currentBranch}`);
        await execAsync(`git checkout ${currentBranch}`);
      } catch (e) {
        console.error(`❌ Failed to switch back to ${currentBranch}: ${e}`);
      }
    }
  }
}

"""

# Insert before applyFixToCodebase definition
content = content.replace(
    "export async function applyFixToCodebase",
    helper_func + "export async function applyFixToCodebase"
)

with open(file_path, 'w') as f:
    f.write(content)

print("Successfully modified server/agents/codingAgent.ts")

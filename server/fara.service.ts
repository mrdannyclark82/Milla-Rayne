
import { spawn } from 'child_process';
import { Readable } from 'stream';
import { existsSync } from 'fs';

class FaraService {
  private vllmProcess: import('child_process').ChildProcess | null = null;
  private isStarting = false;

  constructor() {
    this.startFaraModelServer();
  }

  private async setupPythonEnvironment() {
    console.log('Setting up Fara python environment...');
    const setupCommands = [
      'python3 -m venv .venv',
      // 'source .venv/bin/activate', // Removed as it causes issues when spawned and is not needed with explicit paths
      'pip install -e .',
      'playwright install',
    ];

    for (const cmd of setupCommands) {
      await this.runCommand(cmd, './fara_repo');
    }
    console.log('Fara python environment setup complete.');
  }

  private runCommand(command: string, cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const process = spawn(cmd, args, { cwd, shell: '/bin/bash' });

      process.stdout.on('data', (data) => console.log(data.toString()));
      process.stderr.on('data', (data) => console.error(data.toString()));

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}: ${command}`));
        }
      });
    });
  }

  public async startFaraModelServer() {
    if (this.vllmProcess || this.isStarting) {
      console.log('Fara model server is already starting or running.');
      return;
    }

    this.isStarting = true;
    console.log('Starting Fara model server...');

    try {
      const venvActivatePath = './fara_repo/.venv/bin/activate';
      if (!existsSync(venvActivatePath)) {
        console.log('Fara Python environment not found. Setting it up...');
        await this.setupPythonEnvironment();
        console.log('Fara Python environment setup complete.');
      } else {
        console.log('Fara Python environment already exists.');
      }

      const pythonEnvPath = './fara_repo/.venv/bin';
      const vllmExecutable = `${pythonEnvPath}/vllm`;
      const vllmCommand = `${vllmExecutable} serve "microsoft/Fara-7B" --port 5001 --dtype auto`;
      const [cmd, ...args] = vllmCommand.split(' ');
      
      this.vllmProcess = spawn(cmd, args, {
        cwd: './fara_repo',
        shell: '/bin/bash',
        detached: true, // Allows the child to run independently of the parent
      });
      
      this.vllmProcess.stdout?.on('data', (data) => {
        console.log(`[VLLM Server]: ${data}`);
        // We can look for a specific string that indicates the server is ready
        if (data.toString().includes('Uvicorn running on')) {
            console.log('Fara model server started successfully.');
            this.isStarting = false;
        }
      });

      this.vllmProcess.stderr?.on('data', (data) => {
        console.error(`[VLLM Server ERROR]: ${data}`);
      });

      this.vllmProcess.on('exit', (code, signal) => {
        console.log(`Fara model server exited with code ${code} and signal ${signal}`);
        this.vllmProcess = null;
        this.isStarting = false;
      });

      // We don't want the main Milla-Rayne process to wait for this
      this.vllmProcess.unref();

    } catch (error) {
      console.error('Failed to start Fara model server:', error);
      this.isStarting = false;
    }
  }

  public runFaraTask(task: string): Readable {
    const stream = new Readable({
      read() {},
    });

    if (!this.vllmProcess) {
        stream.push('Fara model server is not running. Please start it first.');
        stream.push(null);
        return stream;
    }

    const pythonEnvPath = './fara_repo/.venv/bin';
    const faraCliExecutable = `${pythonEnvPath}/fara-cli`;
    const args = ['--task', task];

    // No need to activate venv with 'source' if we call the executable directly
    const faraProcess = spawn(faraCliExecutable, args, {
        cwd: './fara_repo',
    });

    faraProcess.stdout?.on('data', (data) => {
      stream.push(data.toString());
    });

    faraProcess.stderr?.on('data', (data) => {
      stream.push(`ERROR: ${data.toString()}`);
    });

    faraProcess.on('close', (code) => {
      stream.push(`\nFara process exited with code ${code}`);
      stream.push(null); // End of stream
    });
    
    faraProcess.on('error', (err) => {
        stream.push(`\nFailed to start Fara process: ${err.message}`);
        stream.push(null);
    })

    return stream;
  }
}

export const faraService = new FaraService();

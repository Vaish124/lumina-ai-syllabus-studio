import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET(): Promise<Response> {
  try {
    const cmd = `powershell -Command "Get-ChildItem -Path 'c:\\Users\\Allenticspun2107\\.gemini\\antigravity\\scratch\\house-of-edtech-assignment' -Exclude node_modules, .next, .git | Compress-Archive -DestinationPath 'C:\\Users\\Allenticspun2107\\Desktop\\house-of-edtech-assignment.zip' -Force"`;
    const { stdout } = await execPromise(cmd);
    return NextResponse.json({ success: true, stdout });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stderr: error.stderr }, { status: 500 });
  }
}

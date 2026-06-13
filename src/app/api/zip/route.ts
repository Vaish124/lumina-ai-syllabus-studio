import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function GET() {
  return new Promise((resolve) => {
    const cmd = `powershell -Command "Get-ChildItem -Path 'c:\\Users\\Allenticspun2107\\.gemini\\antigravity\\scratch\\house-of-edtech-assignment' -Exclude node_modules, .next, .git | Compress-Archive -DestinationPath 'C:\\Users\\Allenticspun2107\\Desktop\\house-of-edtech-assignment.zip' -Force"`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        resolve(NextResponse.json({ error: error.message, stderr }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ success: true, stdout }));
      }
    });
  });
}

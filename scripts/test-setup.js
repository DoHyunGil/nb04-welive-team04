import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// .env.test 파일 로드
config({ path: '.env.test' });

async function runTests() {
  try {
    console.log('🔄 Resetting database...');
    await execAsync('npx prisma migrate reset --force', {
      env: { ...process.env }
    });

    console.log('🔄 Running migrations...');
    await execAsync('npx prisma migrate deploy', {
      env: { ...process.env }
    });

    console.log('🧪 Running tests...');
    const { stdout } = await execAsync('node --experimental-vm-modules ./node_modules/.bin/jest --config jest.config.cjs', {
      env: { ...process.env }
    });
    console.log(stdout);

    console.log('✅ Tests completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  }
}

runTests();

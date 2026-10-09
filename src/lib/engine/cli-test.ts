import { runAnalysis } from './index';

// Simple CLI runner for engine testing from external processes
const args = process.argv.slice(2);
const input = args[0] || 'http://paypa1-account-security.xyz/login';
const forceType = (args[1] as 'url' | 'email') || undefined;

const report = runAnalysis(input, forceType);
console.log(JSON.stringify(report));

const { ESLint } = require('eslint');

async function main() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(['src/**/*.jsx', 'src/**/*.js']);
  for (const r of results) {
    if (r.errorCount > 0) {
      console.log(r.filePath);
      r.messages.forEach(m => console.log(`  Line ${m.line}: ${m.message}`));
    }
  }
}

main().catch(console.error);

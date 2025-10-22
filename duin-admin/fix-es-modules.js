#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix the ES module issue in TypeChain generated files
const contractTypesDir = path.join(__dirname, 'src', 'contractTypes');
const indexPath = path.join(contractTypesDir, 'index.ts');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Replace the problematic directory import with explicit imports
  content = content.replace(
    /export \* as factories from "\.\/factories";/,
    'export { PrivateMarket__factory } from "./factories/PrivateMarket__factory";'
  );
  
  fs.writeFileSync(indexPath, content);
  console.log('Fixed ES module imports in contractTypes/index.ts');
}

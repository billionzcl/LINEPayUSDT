const { execSync } = require('child_process');

console.log('Starting contract tests...');

try {
  // Check if hardhat is available
  console.log('Checking Hardhat installation...');
  execSync('npx hardhat --version', { stdio: 'inherit' });
  
  // Compile contracts
  console.log('\nCompiling contracts...');
  execSync('npx hardhat compile', { stdio: 'inherit' });
  
  // Run tests
  console.log('\nRunning tests...');
  execSync('npx hardhat test', { stdio: 'inherit' });
  
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
}
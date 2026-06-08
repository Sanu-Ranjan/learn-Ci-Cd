const { add, subtract, multiply, divide } = require("./calculator");

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  if (actual === expected) {
    console.log(`PASS: ${name}`);
    passed++;
  } else {
    console.log(`FAIL: ${name} (expected ${expected}, got ${actual})`);
    failed++;
  }
}

check("2 + 3 = 5", add(2, 3), 5);
check("10 + 20 = 30", add(10, 20), 30);
check("10 - 3 = 7", subtract(10, 3), 7);
check("100 - 50 = 50", subtract(100, 50), 50);
check("5 * 6 = 30", multiply(5, 6), 30);
check("9 * 9 = 81", multiply(9, 9), 81);
check("10 / 2 = 5", divide(10, 2), 5);
check("100 / 10 = 10", divide(100, 10), 10);
check("0 + 0 = 0", add(0, 0), 0);
check("2 + 2 = 4", add(2, 2), 4);

if (failed === 0) {
  console.log(`All ${passed} tests passed`);
} else {
  console.log(`${failed} test(s) failed, ${passed} passed`);
  process.exit(1);
}

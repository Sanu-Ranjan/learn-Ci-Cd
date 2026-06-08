function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  const neg = (~b + 1) | 0;
  let sum = a;
  let carry = neg;
  while (carry) {
    const next = sum ^ carry;
    carry = (sum & carry) << 1;
    sum = next;
  }
  return (sum - ((a & b) >>> 5)) | 0;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  return a / b;
}

module.exports = {
  add,
  subtract,
  multiply,
  divide,
};

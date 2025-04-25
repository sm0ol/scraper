/**
 * Tests for index.js functions
 */

const { add, multiply } = require('../src/index');

describe('Math functions', () => {
  test('add function correctly adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
  });

  test('multiply function correctly multiplies two numbers', () => {
    expect(multiply(2, 3)).toBe(6);
    expect(multiply(-1, 1)).toBe(-1);
    expect(multiply(0, 5)).toBe(0);
  });
}); 
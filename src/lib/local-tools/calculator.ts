export function calculateExpression(input: string) {
  const expression = input
    .replace(/^calculate\s+/i, "")
    .replace(/^calc\s+/i, "")
    .trim();

  if (!/^[\d+\-*/().%\s]+$/.test(expression)) {
    throw new Error("Only numbers, parentheses, and + - * / % are allowed.");
  }

  const result = Function(`"use strict"; return (${expression});`)() as unknown;

  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("That expression did not produce a finite number.");
  }

  return {
    expression,
    result,
  };
}

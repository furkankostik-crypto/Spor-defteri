import React from 'react';

/**
 * Normalizes a decimal string input for intuitive keyboard entry:
 * - Converts Turkish/European comma (,) to dot (.)
 * - Keeps only digits and at most one decimal separator
 * - Converts leading "." to "0."
 * - Allows empty string "" while the user clears the field
 */
export function sanitizeDecimalInput(raw: string): string {
  if (!raw) return '';
  const normalized = raw.replace(/,/g, '.');
  let result = '';
  let hasDot = false;

  for (const ch of normalized) {
    if (ch >= '0' && ch <= '9') {
      result += ch;
    } else if (ch === '.' && !hasDot) {
      if (result === '') {
        result = '0.';
      } else {
        result += '.';
      }
      hasDot = true;
    }
  }

  // Prevent multiple leading zeros like "007" -> "7", while keeping "0" and "0.5"
  if (result.length > 1 && result.startsWith('0') && result[1] !== '.') {
    result = result.replace(/^0+/, '') || '0';
  }

  return result;
}

/**
 * Normalizes an integer string input:
 * - Keeps only digits 0-9
 * - Allows empty string "" while the user clears the field
 */
export function sanitizeIntegerInput(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/[^0-9]/g, '');
  if (digits.length > 1 && digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '') || '0';
  }
  return digits;
}

/**
 * Parses a decimal string safely, returning fallback if empty or invalid.
 */
export function parseDecimalOrFallback(raw: string, fallback: number): number {
  if (!raw || raw.trim() === '') return fallback;
  const parsed = parseFloat(raw.replace(/,/g, '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Parses an integer string safely, returning fallback if empty or invalid.
 */
export function parseIntOrFallback(raw: string, fallback: number): number {
  if (!raw || raw.trim() === '') return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Checks whether an IME composition is active (including Safari's keyCode 229 fallback).
 */
export function isImeComposing(e: React.KeyboardEvent): boolean {
  return Boolean(e.nativeEvent.isComposing || (e as unknown as { keyCode?: number }).keyCode === 229);
}

/**
 * Selects all text when an input receives focus, persisting across the initial mouseup/touchend
 * so the user can immediately type a replacement number or clear with a single Backspace.
 */
export function selectAllOnFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void {
  const target = e.currentTarget;
  try {
    target.select();
  } catch {}
  setTimeout(() => {
    try {
      if (document.activeElement === target) {
        target.select();
      }
    } catch {}
  }, 0);
}

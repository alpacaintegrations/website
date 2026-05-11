const ZERO_WIDTH_PATTERN = /[​‌‍﻿⁠­]/g;
const NBSP_PATTERN = / /g;
const SMART_DOUBLE_OPEN = /“/g;
const SMART_DOUBLE_CLOSE = /”/g;
const SMART_SINGLE_OPEN = /‘/g;
const SMART_SINGLE_CLOSE = /’/g;
const ELLIPSIS = /…/g;

export function cleanText(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(ZERO_WIDTH_PATTERN, '')
    .replace(NBSP_PATTERN, ' ')
    .replace(SMART_DOUBLE_OPEN, '"')
    .replace(SMART_DOUBLE_CLOSE, '"')
    .replace(SMART_SINGLE_OPEN, "'")
    .replace(SMART_SINGLE_CLOSE, "'")
    .replace(ELLIPSIS, '...');
}

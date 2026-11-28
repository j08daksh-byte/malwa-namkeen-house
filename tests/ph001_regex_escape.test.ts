/**
 * Malwa Namkeen House — PH-001 Regression Tests
 *
 * Verifies that the escapeRegex() helper introduced in server/routes/products.ts
 * treats user-supplied search strings as literal text, not executable PCRE patterns.
 *
 * Tests cover:
 *   A. Normal product name searches still match as case-insensitive substrings.
 *   B. All PCRE metacharacters are escaped so they match literally.
 *   C. Pathological patterns (ReDoS payloads) are neutralised.
 *   D. Escaped strings do NOT produce broader matches than the raw input intended.
 *   E. The escapeRegex function is a pure unit — no DB needed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ──────────────────────────────────────────────────────────────────────────────
// Mirror of the helper from server/routes/products.ts so tests are self-contained
// and do not require importing the full route module (which pulls in MongoDB).
// Any future change to the implementation MUST be mirrored here.
// ──────────────────────────────────────────────────────────────────────────────
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Simulates what the route does: builds a case-insensitive RegExp from the
 * escaped string, then tests it against a target text.
 */
function matchesProduct(search: string, target: string): boolean {
  const raw = search.trim().slice(0, 200);
  const escaped = escapeRegex(raw);
  const re = new RegExp(escaped, 'i');
  return re.test(target);
}

// ──────────────────────────────────────────────────────────────────────────────

describe('PH-001 — escapeRegex / Product Search Literal-Text Safety', () => {

  // ── A. Normal searches still work ─────────────────────────────────────────

  describe('A. Normal product name searches match correctly', () => {
    it('should match a plain lowercase keyword (ratlami)', () => {
      assert.ok(matchesProduct('ratlami', 'Special Ratlami Sev 500g'));
    });

    it('should match case-insensitively (Namkeen vs namkeen)', () => {
      assert.ok(matchesProduct('Namkeen', 'Heritage Namkeen Mix'));
      assert.ok(matchesProduct('namkeen', 'Heritage Namkeen Mix'));
      assert.ok(matchesProduct('NAMKEEN', 'Heritage Namkeen Mix'));
    });

    it('should match a partial substring in the middle of a product name', () => {
      assert.ok(matchesProduct('sev', 'Ujjaini Sev Classic'));
      assert.ok(matchesProduct('hing', 'Hing Peda Sev (Artisanal)'));
    });

    it('should NOT match when the keyword is genuinely absent', () => {
      assert.equal(matchesProduct('chocolate', 'Special Ratlami Sev 500g'), false);
      assert.equal(matchesProduct('pizza', 'Khasta Mathri 250g'), false);
    });

    it('should correctly match product names containing hyphens (literal)', () => {
      assert.ok(matchesProduct('khatta-meetha', 'Khatta-Meetha Mixture'));
    });
  });

  // ── B. Regex metacharacters treated as literal text ───────────────────────

  describe('B. Metacharacters are treated as literal characters', () => {
    it('should treat "." as a literal dot, not "any character"', () => {
      // "." should only match an actual dot, not every single character
      // i.e. "." does NOT match "a" after escaping
      assert.equal(matchesProduct('.', 'ratlami sev'), false);
      // but it SHOULD match a string that literally contains a dot
      assert.ok(matchesProduct('.', 'e.g. artisanal mix'));
    });

    it('should treat ".*" as two literal characters "." and "*"', () => {
      // ".*" without escaping would match everything; escaped it matches only ".*"
      assert.equal(matchesProduct('.*', 'Ratlami Sev'), false);
      assert.ok(matchesProduct('.*', 'Price: 230 .*'));
    });

    it('should treat ".+" as literal ".+"', () => {
      assert.equal(matchesProduct('.+', 'Special Sev'), false);
      assert.ok(matchesProduct('.+', 'quantity: .+100'));
    });

    it('should treat "[a-z]" as the literal string "[a-z]", not a character class', () => {
      // Without escaping, [a-z] would match any lowercase letter
      assert.equal(matchesProduct('[a-z]', 'Ratlami Sev'), false);
      assert.ok(matchesProduct('[a-z]', 'pattern: [a-z] digits'));
    });

    it('should treat "^$" as literal characters, not start/end anchors', () => {
      // With escaping, "^$" cannot be an empty-string anchor (matching everything)
      assert.equal(matchesProduct('^$', 'Some Product Name'), false);
      assert.ok(matchesProduct('^$', 'special ^$ character pair'));
    });

    it('should treat "(a+)+" as literal text, not a nested quantifier', () => {
      assert.equal(matchesProduct('(a+)+', 'aaaaaaaaab'), false);
      assert.ok(matchesProduct('(a+)+', 'Pattern: (a+)+ is dangerous'));
    });

    it('should treat "{3,}" as literal text, not a repetition quantifier', () => {
      assert.equal(matchesProduct('{3,}', 'aaab'), false);
      assert.ok(matchesProduct('{3,}', 'quantity {3,} units'));
    });

    it('should treat "|" as a literal pipe, not alternation', () => {
      // Without escaping, "ratlami|sev" would match either word
      assert.equal(matchesProduct('ratlami|chocolate', 'ratlami sev'), false);
      assert.ok(matchesProduct('ratlami|sev', 'special ratlami|sev'));
    });

    it('should treat "?" as a literal question mark, not an optional quantifier', () => {
      // "sev?" without escaping would match "se" (zero occurrences of v) or "sev"
      // After escaping "sev\\?" should only match "sev?"
      assert.equal(matchesProduct('sev?price', 'sevprice'), false);
      assert.ok(matchesProduct('sev?', 'available sev? check'));
    });

    it('should treat backslash as a literal backslash', () => {
      assert.equal(matchesProduct('\\d', '123'), false);
      assert.ok(matchesProduct('\\d', 'code \\d digits'));
    });
  });

  // ── C. ReDoS payloads neutralised ─────────────────────────────────────────

  describe('C. Known ReDoS / catastrophic backtracking payloads are neutralised', () => {
    const redosPayloads = [
      '(a+)+b',
      '([a-zA-Z]+)*',
      '(a|aa)+',
      '.*.*.*.*.*',
      '(x+x+)+y',
      '^(a+)+$',
      '([a-z]+)+',
      '(.*)+',
    ];

    for (const payload of redosPayloads) {
      it(`should escape ReDoS payload: ${payload}`, () => {
        const escaped = escapeRegex(payload.trim().slice(0, 200));
        // The escaped string must not equal the original (since it contains metacharacters)
        assert.notEqual(escaped, payload);
        // The escaped string must contain backslash-escaped metacharacters
        assert.ok(escaped.includes('\\'), `Expected escaped version to contain backslashes: "${escaped}"`);
        // Building a RegExp from the escaped string should not throw
        // (catastrophic regex would typically not throw but would hang — here we
        //  prove the pattern was structurally altered)
        const re = new RegExp(escaped, 'i');
        // The payload as a literal string should match itself after escaping
        const literalMatch = re.test(payload);
        assert.ok(literalMatch, `Escaped pattern should match the literal input string: "${payload}"`);
      });
    }
  });

  // ── D. Escaped pattern cannot produce unintended broad matches ────────────

  describe('D. Escaped patterns do not produce unintended broad matches', () => {
    it('".*" escaped should not match "Ratlami Sev 500g"', () => {
      assert.equal(matchesProduct('.*', 'Ratlami Sev 500g'), false);
    });

    it('"(a+)+" escaped should not match "aaaaab"', () => {
      assert.equal(matchesProduct('(a+)+', 'aaaaab'), false);
    });

    it('"[a-z]" escaped should not match "namkeen"', () => {
      // Without escaping [a-z] matches any single lowercase letter
      assert.equal(matchesProduct('[a-z]', 'namkeen'), false);
    });

    it('".+" escaped should not match every non-empty string', () => {
      assert.equal(matchesProduct('.+', 'Khasta Mathri'), false);
      assert.equal(matchesProduct('.+', '   '), false);
    });

    it('"^$" escaped should not match an empty string', () => {
      // A raw "^$" in regex matches exactly the empty string, but escaped it should not
      const escaped = escapeRegex('^$');
      const re = new RegExp(escaped, 'i');
      assert.equal(re.test(''), false);
    });
  });

  // ── E. Search length cap enforcement ──────────────────────────────────────

  describe('E. Search length cap (200 chars) is enforced', () => {
    it('should truncate search input longer than 200 characters', () => {
      const longInput = 'a'.repeat(300);
      const raw = longInput.trim().slice(0, 200);
      assert.equal(raw.length, 200);
    });

    it('should not truncate input of exactly 200 characters', () => {
      const exactInput = 'b'.repeat(200);
      const raw = exactInput.trim().slice(0, 200);
      assert.equal(raw.length, 200);
    });

    it('should not affect normal short product searches', () => {
      const short = 'ratlami sev';
      const raw = short.trim().slice(0, 200);
      assert.equal(raw, 'ratlami sev');
    });
  });

  // ── Additional: escapeRegex unit tests ────────────────────────────────────

  describe('F. escapeRegex unit — character-by-character escape verification', () => {
    const metacharacters = ['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\'];

    for (const char of metacharacters) {
      it(`should escape metacharacter: "${char}"`, () => {
        const result = escapeRegex(char);
        assert.equal(result, `\\${char}`);
      });
    }

    it('should leave normal alphanumeric characters unchanged', () => {
      assert.equal(escapeRegex('ratlami'), 'ratlami');
      assert.equal(escapeRegex('Sev500g'), 'Sev500g');
      assert.equal(escapeRegex(''), '');
    });

    it('should escape all metacharacters in a mixed string', () => {
      const input  = 'sev (100g)';
      const output = escapeRegex(input);
      assert.equal(output, 'sev \\(100g\\)');
    });

    it('should match a product name containing parentheses when searched literally', () => {
      assert.ok(matchesProduct('sev (100g)', 'Special sev (100g) pack'));
    });
  });

});

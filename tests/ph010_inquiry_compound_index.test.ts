import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Inquiry } from '../server/models/Inquiry.ts';

describe('PH-010 — Inquiry Model Admin Compound Index', () => {
  it('should define the compound index { status: 1, createdAt: -1 }', () => {
    const indexes = Inquiry.schema.indexes();
    
    const compoundIndex = indexes.find(
      (idx: any) => 
        idx[0].status === 1 && 
        idx[0].createdAt === -1
    );

    assert.ok(
      compoundIndex,
      'The compound index { status: 1, createdAt: -1 } is missing from Inquiry schema'
    );
  });

  it('should remove the redundant single-field status index', () => {
    const indexes = Inquiry.schema.indexes();
    
    const singleStatusIndex = indexes.find(
      (idx: any) => 
        idx[0].status === 1 && 
        Object.keys(idx[0]).length === 1
    );

    assert.ok(
      !singleStatusIndex,
      'The redundant single-field status index was not removed'
    );
  });

  it('should verify single-field email index was removed under PH-018', () => {
    const indexes = Inquiry.schema.indexes();

    const hasEmail = indexes.some((idx: any) => idx[0].email === 1);
    assert.strictEqual(hasEmail, false, 'Redundant email index should not be present');
  });
});

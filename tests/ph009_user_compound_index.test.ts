import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../server/models/User.ts';

describe('PH-009 — User Model Admin Customer Index', () => {
  it('should define the technically superior compound index for admin customer lists', () => {
    const indexes = User.schema.indexes();
    
    // Find the new PH-009 compound index: { role: 1, createdAt: -1, active: 1 }
    const adminCustomerIndex = indexes.find(
      (idx: any) => 
        idx[0].role === 1 && 
        idx[0].createdAt === -1 && 
        idx[0].active === 1
    );

    assert.ok(
      adminCustomerIndex,
      'The compound index { role: 1, createdAt: -1, active: 1 } is missing from User schema'
    );
  });

  it('should preserve existing single-field and unique indexes', () => {
    const indexes = User.schema.indexes();

    const hasEmailUnique = indexes.some((idx: any) => idx[0].email === 1 && idx[1].unique === true);
    assert.ok(hasEmailUnique, 'email unique index is missing');

    const hasGoogleId = indexes.some((idx: any) => idx[0].googleId === 1 && idx[1].sparse === true);
    assert.ok(hasGoogleId, 'googleId sparse index is missing');

    const hasActive = indexes.some((idx: any) => idx[0].active === 1 && Object.keys(idx[0]).length === 1);
    assert.ok(hasActive, 'active standalone index is missing');

    const hasPasswordReset = indexes.some((idx: any) => idx[0].passwordResetTokenHash === 1);
    assert.ok(hasPasswordReset, 'passwordResetTokenHash index is missing');

    const hasInvitationToken = indexes.some((idx: any) => idx[0].invitationTokenHash === 1);
    assert.ok(hasInvitationToken, 'invitationTokenHash index is missing');
  });
});

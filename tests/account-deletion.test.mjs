import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deleteAccountResources } from '../src/lib/account-deletion.ts';

function setup(overrides = {}) {
  const calls = [];
  const actions = {
    deleteWorkspace: async () => { calls.push('delete cloud'); },
    workspaceExists: async () => { calls.push('verify'); return false; },
    deleteIdentity: async () => { calls.push('delete identity'); },
    clearLocal: () => { calls.push('clear local'); },
    ...overrides,
  };
  return { calls, actions };
}
test('deletes cloud then identity then local copy', async () => {
  const { calls, actions } = setup();
  await deleteAccountResources(actions);
  assert.deepEqual(calls, ['delete cloud', 'verify', 'delete identity', 'clear local']);
});
test('cloud failure leaves identity and local copy intact', async () => {
  const { calls, actions } = setup({ deleteWorkspace: async () => { throw Error('network'); } });
  await assert.rejects(deleteAccountResources(actions), /network/);
  assert.deepEqual(calls, []);
});
test('unverified cloud deletion does not delete the identity', async () => {
  const { calls, actions } = setup({ workspaceExists: async () => true });
  await assert.rejects(deleteAccountResources(actions), /not deleted/);
  assert.deepEqual(calls, ['delete cloud']);
});
test('Clerk failure explains partial deletion and preserves local copy', async () => {
  const { calls, actions } = setup({ deleteIdentity: async () => { throw Error('denied'); } });
  await assert.rejects(deleteAccountResources(actions), /cloud workspace was deleted.*denied/);
  assert.deepEqual(calls, ['delete cloud', 'verify']);
});

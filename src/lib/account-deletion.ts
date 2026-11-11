/** Delete the account only after the workspace is confirmed gone. This is not atomic
 * across Clerk and Supabase, so a failed second step must be surfaced explicitly. */
export async function deleteAccountResources(actions: {
  deleteWorkspace: () => Promise<void>;
  workspaceExists: () => Promise<boolean>;
  deleteIdentity: () => Promise<void>;
  clearLocal: () => void;
}) {
  await actions.deleteWorkspace();
  if (await actions.workspaceExists()) {
    throw new Error("Could not verify cloud workspace deletion. Your account was not deleted.");
  }
  try {
    await actions.deleteIdentity();
  } catch (error) {
    throw new Error(`Your cloud workspace was deleted, but Clerk could not delete your account. Saving is paused; retry deletion. ${error instanceof Error ? error.message : ""}`);
  }
  actions.clearLocal();
}

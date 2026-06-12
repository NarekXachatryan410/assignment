ALTER TABLE `Invitation`
  ADD UNIQUE INDEX `Invitation_projectId_invitedUserId_status_key` (`projectId`, `invitedUserId`, `status`);

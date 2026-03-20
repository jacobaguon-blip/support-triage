Hi James,

We confirmed the domain field reverting is a bug on our end. The system is resetting it back to shakepay.co on each sync cycle, which is why your contractor domain users keep getting excluded. We've logged this with our engineering team to get it fixed so the setting actually sticks.

For the SSO issue with your contractors on the secondary domain, we're checking with our team on how SSO handles multiple domains within the same Google Workspace account. I don't have a definitive answer yet but I'll follow up as soon as I hear back.

For the automation workflows you asked about, you can start building these now. Go to Settings > Automations, create a new automation, and use the "Perform connector action" step to chain Google Workspace actions together.

Here are the offboarding actions you can use:
- disable_user to suspend the account
- sign_out_user to kill active sessions and reset cookies
- delete_all_oauth_tokens to revoke third-party app authorizations
- delete_all_application_passwords to remove app-specific passwords
- offboarding_profile_update to remove the user from the directory, clear recovery details, and optionally archive the account
- change_user_org_unit to move them into an "Offboarded" OU
- transfer_user_drive_files to transfer their Drive files to another user
- transfer_user_calendar to hand off their calendar data
- change_user_primary_email to rename the account to an archive address

For onboarding, the main ones are enable_user to activate an account, change_user_org_unit to place them in the right department, and update_user_manager to set the reporting structure.

You can trigger these automations when a user's status changes in your directory. If you want to connect it to your HRIS, inbound webhooks let you kick off automations from external systems. The full docs for building automations are at conductorone.com/docs/product/admin/automations, and the complete list of Google Workspace actions is at conductorone.com/docs/baton/google-workspace.

Glad to see the connector actions are showing up now. Let me know if you hit anything while setting up the workflows.

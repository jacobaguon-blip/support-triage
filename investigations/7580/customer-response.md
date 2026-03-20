Hi Sam,

Wanted to circle back on this since there's been some movement. You were right that "Assigned to" only covers open tasks, so it's not going to help for historical approver tracking.

The good news is we've since shipped a "Reviewed by" filter on the task log. It lets you filter completed tasks by who acted on them, so it should get you closer to seeing everything JonD has interacted with. Check your task log filters and let us know if it shows up for you.

We're also building a dedicated "Approved by" filter, which is in active development now. And the API workaround Jacob shared (assignedOrStepApproverUserId on the search tasks endpoint) still works if you need a quick programmatic pull in the meantime.

Your feedback about surfacing this in the analytics dashboard has been logged with our product team.

Let us know if the "Reviewed by" filter covers what you need!

Hi Sam,

Following up on this one — we wanted to give you an update since there's been some progress on the product side.

You're right that the "Assigned to" filter only covers open tasks, so it won't help for seeing who approved what historically. Since we last spoke, our team has shipped a "Reviewed by" filter on the task log that lets you filter completed tasks by who acted on them. You should see it in your task log filters now — that may get you closer to what you need for tracking someone like JonD's activity.

On top of that, we're actively building a dedicated "Approved by" filter for the task log as well. That one's in progress with our engineering team now, so you should see it land soon.

In the meantime, the API workaround Jacob shared previously (using assignedOrStepApproverUserId on the search tasks endpoint) still works if you need a quick programmatic pull. And we've logged your feedback about surfacing this in the analytics dashboard — that's on our product team's radar.

Let us know if the "Reviewed by" filter works for your use case, or if you have any questions!

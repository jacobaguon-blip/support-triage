Hi there,

Thanks for flagging this issue with the "Review policy" page showing blank after the recent UI update. I appreciate you reporting it even though you haven't been able to reproduce it consistently — intermittent issues like this are actually really helpful to know about, as they often point to timing or loading issues on our end.

**What we're seeing**

Based on your report, this appears to be a rendering issue that's likely triggered by specific conditions (timing, browser state, navigation path, etc.). The fact that it's inconsistent suggests it might be a race condition where the page tries to display before all the data is fully loaded, or there might be an error that's failing silently.

**What would help us investigate**

Since you mentioned you can't reproduce it reliably, here are a few things that would really help us track this down:

- **Next time it happens:** Could you grab a screenshot and check your browser's console for any errors? (Right-click → Inspect → Console tab)
- **Browser details:** Which browser and version are you using?
- **How you got there:** What were the steps you took right before the blank page appeared? (e.g., navigated from dashboard → policies → clicked specific policy)
- **Which policy:** Does this happen with a specific policy, or have you seen it across different ones?
- **Frequency:** Roughly how often does this occur? Once a day? Once a week?

**What we're doing**

I'm escalating this to our engineering team to review recent changes to the policy UI. We'll check our error monitoring systems for any anomalies in your environment and review the deployment that corresponds with the "UI update" you mentioned. If this is affecting other customers or we can identify the conditions that trigger it, we'll prioritize a fix.

In the meantime, if you encounter the blank page again, a browser refresh usually resolves temporary rendering issues — though that's obviously not a real solution, just a workaround while we investigate.

Let me know if you're able to capture any of those details the next time it occurs, or if you have any other information that might help us track this down.

Thanks again for reporting this!

---
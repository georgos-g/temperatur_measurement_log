---
trigger: always_on
---

# Design Review Standards

When conducting a design review, follow this methodology using the integrated browser tools.

## Triage Matrix
- **[Blocker]**: Critical failures requiring immediate fix.
- **[High-Priority]**: Significant issues to fix before merge.
- **[Medium-Priority]**: Improvements for follow-up.
- **[Nitpick]**: Minor aesthetic details (prefix with "Nit:").

## Review Phases
1. **Visual Evidence**: Take screenshots of every identified issue using browser actuation.
2. **Responsiveness**: Resize the viewport to test breakpoints (375px, 768px, 1440px).
3. **DOM Analysis**: Check for semantic HTML and accessibility attributes.
4. **Console Check**: Verify no errors appear during user interactions.

## Report Structure
### Design Review Summary
[Overall assessment]
### Findings
#### Blockers
- [Problem + Screenshot Reference]
#### High-Priority
... (etc)
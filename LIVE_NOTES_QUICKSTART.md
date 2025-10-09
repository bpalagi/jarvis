# Live Note-Taking Quick Reference

## What is it?

Live Note-Taking automatically creates and updates markdown notes during your Listen sessions. You can view these notes in real-time on the Activity page and edit them manually.

## How to Use

### Start Taking Notes

1. Click the **Listen** button (or press `Cmd + L`)
2. Open your browser to the Activity page (URL shown in app logs)
3. You'll see a "Live Session" section with a blue pulsing indicator

### View Live Updates

- Notes update automatically every 5 seconds
- New transcripts appear as they're captured
- AI summaries are added when generated (every ~3 conversation turns)

### Edit Notes Manually

1. Click **Edit Notes** button in the Live Session section
2. Modify the markdown text in the editor
3. Click **Save Notes** to persist your changes
4. Click **Cancel** to discard changes

### End Session

1. Click **Stop** in the desktop app (or the Listen button again)
2. The session moves to "Your Past Activity"
3. Notes are saved and accessible anytime

### View Past Notes

1. Go to Activity page
2. Click any past session
3. View the Notes section with your saved content

## Note Format

Your notes are automatically formatted as markdown:

```markdown
# Live Notes

## Summary
> Quick overview of the conversation

### Key Points
- Important point 1
- Important point 2

### Action Items
- [ ] Task to complete
- [ ] Another task

## Transcript
**Speaker1:** What they said
**Speaker2:** Their response
```

## Tips

### Editing Tips

- Use markdown syntax for formatting:
  - `# Header`, `## Subheader`, `### Smaller header`
  - `- Bullet point` or `* Bullet point`
  - `1. Numbered list`
  - `- [ ] Checkbox (unchecked)` or `- [x] Checkbox (checked)`
  - `**bold text**`, `*italic text*`
  - `` `inline code` ``
  - `> Blockquote`

- Your manual edits persist even as auto-generated content updates
- You can delete auto-generated sections if not needed
- Add your own sections and comments

### Best Practices

1. **Let it run**: Start Listen and let notes generate automatically
2. **Review periodically**: Check the Activity page to see what's captured
3. **Add context**: Use the editor to add your own thoughts and context
4. **Clean up**: After the session, edit to remove unnecessary parts
5. **Use action items**: Add `- [ ]` checkboxes for tasks to complete

### Performance

- Polling every 5 seconds (minimal impact)
- Notes stored locally in SQLite database
- No cloud sync (coming in future versions)
- Edit responsiveness is instant

## Keyboard Shortcuts

While on Activity page:
- No special shortcuts yet (coming in future versions)

In the desktop app:
- `Cmd + L` - Start/stop Listen mode
- `Cmd + \` - Show/hide main window

## Troubleshooting

### Notes not appearing?
- Check that Listen session is active (green indicator in desktop app)
- Verify you're speaking/audio is being captured
- Check browser console for errors

### Changes not saving?
- Ensure you clicked "Save Notes" button
- Check that session is still active (not ended)
- Verify network connection to backend API

### Markdown not rendering?
- Some complex markdown may not render perfectly
- Basic formatting (headers, lists, bold) should work
- Check for syntax errors in your markdown

### Session not showing as active?
- Verify Listen is running in desktop app
- Check that session has `ended_at = NULL` in database
- Refresh the Activity page

## Examples

### Meeting Notes

```markdown
# Team Standup - Jan 15, 2025

## Attendees
- Alice (Product)
- Bob (Engineering)
- Carol (Design)

## Summary
> Quick sync on sprint progress and blockers

### Key Points
- Feature X is 80% complete
- Need design review for Feature Y
- Deployment planned for Friday

### Action Items
- [ ] Alice: Schedule design review
- [ ] Bob: Fix critical bug #123
- [ ] Carol: Update mockups by EOD

## Discussion Notes

**Alice:** How's Feature X coming along?

**Bob:** Almost done, just need to add tests.

**Carol:** I'll have the new designs ready tomorrow.
```

### Lecture Notes

```markdown
# CS101 - Data Structures Lecture

## Summary
> Introduction to binary trees and traversal algorithms

### Key Concepts
- Binary trees have at most 2 children per node
- In-order traversal: left, root, right
- Pre-order traversal: root, left, right
- Post-order traversal: left, right, root

### Questions to Review
- [ ] How does tree balancing work?
- [ ] What's the complexity of tree operations?

### Personal Notes
Remember: In-order traversal of BST gives sorted order!
```

### Interview Notes

```markdown
# Candidate Interview - Senior Engineer

## Summary
> Strong technical background, good culture fit

### Strengths
- 8 years of experience with React
- Led multiple large projects
- Excellent communication skills

### Concerns
- Limited backend experience
- No distributed systems work

### Action Items
- [ ] Send follow-up technical question
- [ ] Schedule team lunch
- [ ] Check references

### Next Steps
Moving to final round
```

## Advanced Usage

### Custom Templates

You can create your own note template by editing during the first session, then copying the structure for future sessions.

### Exporting Notes

Currently: Copy/paste markdown to your preferred editor
Coming soon: Direct export to .md file

### Collaboration

Currently: Single user only
Coming soon: Multi-user editing and sharing

## Getting Help

- Check `LIVE_NOTES_TESTING.md` for detailed testing scenarios
- Check `LIVE_NOTES_ARCHITECTURE.md` for technical details
- Open an issue on GitHub for bugs or feature requests

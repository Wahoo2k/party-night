# Art prompts

Shared style line, used on every prompt so the set matches:
"Painted storybook-style, bold simple shapes, soft painterly texture, playful not scary. No text, no letters, no logos."

Save each file into `art/` with the name shown. The app picks them up by name; a missing file falls back to the drawn version.

## Werewolf
| File | Shape | Prompt |
|---|---|---|
| `werewolf.jpg` | 4:3 | A friendly wolf howling on a hill in front of a huge glowing full moon above a cozy little village with lit windows at night. Rich deep blues and warm gold light. |
| `werewolf-bg.jpg` | 16:9 | Wide background: a cozy medieval village at night under a huge glowing full moon, lit windows, misty forest and hills, lots of calm dark sky and open space in the middle. No characters. |
| `werewolf-role-W.jpg` | 3:4 | Character card: a sly werewolf with glowing yellow eyes grinning in the moonlight, half hidden behind a tree, head and shoulders, centered. Deep blue night background. No border. |
| `werewolf-role-V.jpg` | 3:4 | Character card: a friendly medieval villager farmer holding a lantern at night, a little nervous, head and shoulders, centered. Deep blue night background with warm lantern glow. No border. |
| `werewolf-role-S.jpg` | 3:4 | Character card: a wise fortune-teller seer in a starry cloak gazing into a glowing crystal ball, head and shoulders, centered. Deep purple and blue night background with gold glow. No border. |
| `werewolf-role-D.jpg` | 3:4 | Character card: a kind medieval village healer carrying a satchel of herbs and a small glowing potion bottle, head and shoulders, centered. Deep blue night background with soft green glow. No border. |
| `werewolf-village.jpg` | 16:9 | Ending scene: sunrise over a cozy medieval village, happy villagers cheering and throwing their hats in the square, a wolf running away over the hill. Warm gold, pink and soft blue dawn. |
| `werewolf-wolves.jpg` | 16:9 | Ending scene: three grinning werewolves howling triumphantly on the rooftops of a quiet medieval village under a giant red-tinted full moon, all windows dark. Deep blue and crimson, dramatic but playful, not gory. |

## Art already made (full size, in art/)
`werewolf.jpg`, `imposter.jpg`, `funny.jpg`, `quick.jpg`, `sketch.jpg`, `werewolf-bg.jpg`

## In-game art (not covers)
- `bg-<theme>.jpg` (16:9): painted backdrop behind every game in that theme (comic, paper, sketch, kids, show, noir, teams, felt). Empty middle, detail at the edges, no text, no people.
- `midnight-<role>.jpg` (3:4): Midnight Wolves role portraits shown on the phone's "look at your card" screen. wolf/seer/villager are copies of the Werewolf portraits; robber, trouble, drunk (Sleepwalker), insomniac (Night Owl) are new.
- Werewolf's `werewolf-bg.jpg` is also the backdrop for Midnight Wolves and Haunted House.
- These files are not covers: keep them out of `PAINTED` in js/art.js.

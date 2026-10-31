# Owner report candidates (pilot)

Threads found by search that match kites in the catalog. **None of these have been read yet.** Kiteforum blocks automated readers, and Reddit blocks Anthropic's crawler, so each one needs a human read before it goes in.

For each thread:

1. Open it and confirm which model year the posters actually own. The thread must match the kite file's year, or `validate-kites` will reject it.
2. Count only posters who say they **own** the kite. Leave out demos, "my mate says", and anyone who discloses a shop, team or brand tie.
3. Add it:

   ```bash
   npm run add-owner-report -- --slug <slug> --url "<thread url>" --platform kiteforum \
     --title "<thread title>" --posted YYYY-MM --year <model year> --owners <n> \
     --excerpt "<one short verbatim quote>" --summary "<what owners agreed on>" --approved-by Ted
   ```

## Candidates

| Kite slug | Thread | Check before adding |
|---|---|---|
| core-pace-pro-2025 | [Core Pace Pro 10m User Review](https://kiteforum.com/viewtopic.php?p=1227820) | Confirm it's the v1 (3-strut), not the Pace Pro 2 |
| slingshot-code-v2-2025 | [Slingshot code v1 compared to v2](https://kiteforum.com/viewtopic.php?f=1&t=2418786) | Count only V2 owners |
| slingshot-code-v2-2025 | [Code V2 7m Demo](https://kiteforum.com/viewtopic.php?f=1&t=2418744) | The title says demo, so the original poster may not count as an owner |
| slingshot-machine-v3-2025 | [Slingshot machine V3](https://kiteforum.com/viewtopic.php?f=1&t=2419178) | Check whether anyone has ridden it or it's launch chatter |
| reedin-supermodel-v3-2025 | [Reedin HTF vs Supermodel V3](https://kiteforum.com/viewtopic.php?t=2417785) | Split V3 owners from HTF owners |
| core-xr8-2026 | [Core XR8 - The Ultimate High](https://kiteforum.com/viewtopic.php?t=2415684) | The thread is from the 2023 launch. Core doesn't use model years, so decide whether `core-xr8-2026` should become `core-xr8-2023` first |

## Reddit

r/Kiteboarding has the most owner traffic, but Reddit's data terms restrict commercial reuse, and findmykite has buy links. A link plus a short quote and your own summary is fine. Don't bulk-collect posts or copy them in full.

## Also found

A Kiteforum thread titled "Portrait Kite Portal is a joke" (`viewtopic.php?p=1236165`). "Portrait Kite" was the unverifiable source behind the three ratings the audit removed.

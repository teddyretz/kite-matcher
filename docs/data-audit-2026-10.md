# Kite data audit — October 2026

Specs were checked against manufacturer pages and retailer spec sheets (MACkite, Kitemana, rideevolve, Real Watersports, Kite Republic). Review attributions were checked against video titles and upload dates on Jason Montreal's channel.

## Fabricated or ungrounded data removed

- **`aggregate_placeholder` reviews were deleted from all 79 kites.** They had invented scores and review counts, plus quotes attributed to "Kiteforum", "Reddit" and "YouTube – Kite Lounge". The URLs were fake (for example `kiteforum.com/viewtopic.php?t=<slug>`). The UI never rendered them, but they would have surfaced eventually.
- **Three `structured_review` ratings had no transcript behind them.** All three were sourced only to "Portrait Kite": `duotone-evo-2025`, `north-orbit-2025` and `slingshot-code-v2-2025`. The latter two now have real, grounded reviews. `duotone-evo-2025` has no rating.
- `validate-kites` now fails the build when:
  - a rating has no transcript behind it
  - two kites have identical summaries (this is how the duplicate Era file slipped in)
  - sizes are not strictly ascending
  - `wind_range_low` is not below `wind_range_high`

## Reviews attached to the wrong kite

| Kite | Problem | Fix |
|---|---|---|
| duotone-rebel-sls-2026 | Only review was Jason's Nov 2024 *Rebel D/LAB* video | Review and rating removed; no Rebel SLS 2026 review exists yet |
| duotone-evo-sls-2026 | Had Jason's Nov 2024 "Rebel SLS & D/LAB vs Evo D/LAB" video | Replaced with his Mar 2026 "2026 Evo D/LAB & SLS" review; rating regenerated |
| north-orbit-2026 | Had Jason's "2025 North Orbit Range" video | Moved to north-orbit-2025 (rating regenerated there) |
| slingshot-code-nxt-2026 | Had Jason's Aug 2024 Code V2 & NXT **v1** video | Moved to slingshot-code-v2-2025; NXT 2026 now has his NXT V2 review |
| core-pace-pro-2026 | Data and review were the 3-strut **v1** (Oct 2024) | Split: `core-pace-pro-2025` (v1 + review, discontinued); `core-pace-pro-2026` rewritten as the 5-strut Pace Pro 2 |
| eleveight-rs-v10-2026 | Video was the Aluula *RS Pro* | Removed |
| flysurfer-stoke-3-2025 | Video was the *Stoke v2* | Removed |

## Kites removed (301 redirects added in `next.config.mjs`)

- `north-orbit-pro-2026`: North's 2026 range is Orbit + Orbit Ultra; no 2026 Orbit Pro exists. Its Kite Republic video reviews the 2026 Orbit, so it moved there.
- `flysurfer-era-2-2026`: an exact duplicate of `flysurfer-era-2025` (same text and video). The Era 2 launched in 2025, so `flysurfer-era-2025` is now named "Era 2".

## Spec corrections

| Kite | Field | Was → Now |
|---|---|---|
| core-pace-2026 | profile | foil/lightwind crossover (style 20) → 3-strut big air/kiteloop all-rounder (style 78); sizes 5–13.5 |
| duotone-evo-dlab-2026 | struts | 5 → 3 |
| ozone-vortex-ultra-x-v1-2025 | struts, sizes | 5 → 3; 5–14 → 5–13, 15 |
| ozone-hyperlink-v3-2025 | struts, sizes | 1 → 0 (closed-cell foil); 5/7/9/11/13 |
| airush-lift-2026 | struts, sizes | 3 → 5 (Lift V4); 7/8/9/10/12/14 |
| harlem-hadlow-pro-2025 | struts | 3 → 5 |
| cabrinha-switchblade-2025 / -apex-2026 | struts | 3 → 5 |
| reedin-hypermodel-2025 / -2026 | aluula | false → true |
| ozone edge v11 / edge vt / vortex v1 | bar_type | high-y → low-v (Jason: Vortex felt off on high-Y) |
| ozone-edge-vt-2026 | sizes | 5–14 → 6–13, 15, 18 |
| slingshot-code-nxt-2026 | model, sizes | Code NXT → Code NXT V2; 7/8/9/10/12/14 |
| slingshot-ghost-v4-2026 | sizes, wave | 3–17 lineup; wave 70 → 35 |
| slingshot-machine-v3-2025 | sizes | 6/7/8/9/10/12 |
| duotone-dice-sls-2026 | sizes | 6–13 |
| cabrinha-nitro-apex-2026 | sizes | 6/7/8/9/10/12 |
| core-xr8-2026 | sizes | no 19m; 15/17 are LW |
| flysurfer-sonic-5-2026 | sizes | 7/10/12/15 |
| core-xr7-2025, eleveight-xs-pro-2025 | discontinued | true (replaced by XR8 / Stratos+) |

## Added (11 kites)

2027: Duotone Evo D/LAB, Evo SLS, Neo SLS, Dice SLS; North Orbit, Orbit Ultra (N-u80); Cabrinha Nitro Apex.
2026 (reviewed by Jason Montreal, missing from the catalog): Ozone Vortex Ultra-X V2, Ozone Reflex V1, Eleveight Stratos+ V1, Harlem Thrive V2.

The new kites have no photos yet; KiteCard shows its brand-color fallback.

## Jason Montreal sweep

His channel has 34 numbered big air reviews. Before this audit, 15 videos were in the data and 4 were on the wrong kite. Added in this pass:

| Video | Kite |
|---|---|
| #25 | Vortex Ultra-X V2 |
| #28 | Code NXT V2 |
| #29 | Ozone Reflex |
| #24 | Evo SLS (re-attached) |
| Sonic 5 vs Juice D/LAB | Sonic 5 and Juice D/LAB |
| My First Session on a Foil Kite | Sonic 5 |

## Still unverified (worth a look)

- **Prices.** Many `price_new` values look like sale or old prices. For example, the Cabrinha Moto X and Drifter are both at $989. Most new-kite prices are the low end of a retailer range.
- **Core model years.** Core doesn't use model years, so the `year` values on Core kites are arbitrary. The XR8 launched in 2023 but is filed as 2026.
- **Possibly obsolete models:**
  - `ozone-enduro-v4-2026`: retailers say the Reflex replaces the Enduro line.
  - `eleveight-rs-v6-2025` vs `rs-v10-2026`: Eleveight's RS versioning is inconsistent across retailers.
- **F-One Bandit 2025.** Its only review is Gleiten's "Bandit **Brainchild** 2025" test, but the file is not flagged `brainchild`.
- **Unconfirmed specs:**
  - Core Impact 2: strut count unconfirmed; a retailer calls it a "pure C".
  - Duotone Juice and Neo: 2026 strut counts unconfirmed.
- **Scores are judgment calls, not specs.** `style_spectrum`, `low_end_power` and `depower_range` on the new kites are estimated from peers and review language.

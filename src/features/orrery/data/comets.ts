import type { CelestialBody } from "../types";

/**
 * Two famous long-period visitors, on the same two-body Keplerian elements
 * as everything else in `lib/kepler.ts` — their extreme eccentricity needs
 * no special-casing, only `solveEccentricAnomaly`'s existing high-e starting
 * guess (E₀ = π rather than the mean anomaly itself). `meanAnomalyAtEpochDeg`
 * is derived from each comet's well-documented perihelion date rather than a
 * catalog value, since these osculating elements already carry the same
 * "real shape and phase, not a perturbation-corrected ephemeris" caveat as
 * the planets (see `lib/kepler.ts`'s module comment).
 *
 * Hale-Bopp is the more interesting demonstration of that: propagating its
 * orbit from its 1997 perihelion with nothing but two-body mechanics places
 * it roughly 50 AU out today — already past Pluto, which matches its real,
 * observed post-perihelion recession. That's the payoff of doing the
 * mechanics for real instead of animating a decorative loop.
 */
export const COMETS: CelestialBody[] = [
  {
    id: "halley",
    name: "1P/Halley",
    kind: "comet",
    elements: {
      semiMajorAxisAu: 17.834,
      eccentricity: 0.96714,
      inclinationDeg: 162.26,
      ascendingNodeDeg: 58.42,
      argPeriapsisDeg: 111.33,
      // Perihelion 1986-02-09; advanced to J2000.0 at 360°/27,510-day period.
      meanAnomalyAtEpochDeg: 66.4,
      periodDays: 27_510,
    },
    physical: {
      radiusKm: 5.5,
      massKg: 2.2e14,
      rotationHours: 52.8,
      axialTiltDeg: 0,
      meanTempC: -100,
      moonCount: 0,
      gravityMs2: 0.00009,
      color: "#3a3a3a",
      facts: [
        "Halley's nucleus is one of the darkest known objects in the solar system, reflecting only about 4% of the sunlight that hits it.",
        "It returns roughly every 75-76 years and was last seen from Earth in 1986; its next perihelion is 2061.",
        "It's the only known short-period comet reliably visible to the naked eye from Earth, which is why it's been recorded by observers since at least 240 BCE.",
      ],
    },
  },
  {
    id: "hale-bopp",
    name: "C/1995 O1 (Hale-Bopp)",
    kind: "comet",
    elements: {
      semiMajorAxisAu: 186.0,
      eccentricity: 0.99509,
      inclinationDeg: 89.43,
      ascendingNodeDeg: 282.47,
      argPeriapsisDeg: 130.59,
      // Perihelion 1997-04-01; advanced to J2000.0 at 360°/~926,600-day period.
      meanAnomalyAtEpochDeg: 0.39,
      periodDays: 926_600,
    },
    physical: {
      radiusKm: 30,
      massKg: 1e16,
      rotationHours: 11.8,
      axialTiltDeg: 0,
      meanTempC: -220,
      moonCount: 0,
      gravityMs2: 0.0007,
      color: "#c9d6e0",
      facts: [
        "Hale-Bopp's nucleus is estimated at 60 km across — among the largest ever measured for a comet, which is why it stayed naked-eye visible for a record 18 months in 1996-97.",
        "Its orbital period was roughly 4,200 years before its 1997 pass; Jupiter's gravity shortened it to about 2,500 years on the way out.",
        "It won't return until roughly the 44th century — propagating its real orbit forward from 1997 already places it well past Pluto today.",
      ],
    },
  },
];

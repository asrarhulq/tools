/**
 * Identity + citation constants for Alley Tracker: Boilermaker Edition.
 *
 * Kept in one place so the page header, the methods panel and the PDF report
 * can never disagree about who wrote it, for which course, or what it cites.
 * The author string matches the attribution used by the hub's other reports.
 */
export const PROJECT = {
  title: "Alley Tracker: Boilermaker Edition",
  subtitle:
    "Replicating and extending Agee et al. (2016): the spatial redistribution of U.S. tornado activity, 1954–2024",
  author: "Asrar ul Haq",
  course: "EAPS 225",
  courseLine: "Final Project, EAPS 225",
  instructor: "Professor Daniel Chavas",
  department: "Department of Earth, Atmospheric, and Planetary Sciences",
  university: "Purdue University",
  place: "West Lafayette, Indiana",
} as const;

export const REFERENCES: readonly string[] = [
  "Agee, E., J. Larson, S. Childs, and A. Marmo, 2016: Spatial redistribution of U.S. tornado activity between 1954 and 2013. J. Appl. Meteor. Climatol., 55, 1681–1697, doi:10.1175/JAMC-D-15-0342.1.",
  "Elmore, K. L., M. E. Baldwin, and D. M. Schultz, 2006: Field significance revisited: Spatial bias errors in forecasts as applied to the Eta Model. Mon. Wea. Rev., 134, 519–531, doi:10.1175/MWR3077.1.",
  "Livezey, R. E., and W. Y. Chen, 1983: Statistical field significance and its determination by Monte Carlo techniques. Mon. Wea. Rev., 111, 46–59.",
  "Künsch, H. R., 1989: The jackknife and the bootstrap for general stationary observations. Ann. Stat., 17, 1217–1241.",
  "Sen, P. K., 1968: Estimates of the regression coefficient based on Kendall's tau. J. Amer. Stat. Assoc., 63, 1379–1389.",
  "Mann, H. B., 1945: Nonparametric tests against trend. Econometrica, 13, 245–259.",
  "NOAA/NWS Storm Prediction Center, 2025: Severe Weather Database, 1950–2024 actual tornadoes (CSV). https://www.spc.noaa.gov/wcm/",
  "U.S. Census Bureau cartographic boundaries, via us-atlas 3.0.1 (ISC license), for state outlines.",
];

/** Paper values used in the validation table (Agee et al. 2016, Sec. 2–4). */
export const PAPER = {
  maxBoxI: 477,
  maxBoxII: 477,
  f2MaxI: 271,
  f2MaxII: 185,
  daysMaxI: 246,
  daysMaxII: 208,
  stateOK: [1096, 713],
  stateTN: [275, 457],
  fieldSigF1: { N: 27.5, threshold: 8.75 },
  fieldSigF2: { N: 37.5, threshold: 8.75 },
} as const;

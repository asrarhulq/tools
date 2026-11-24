/**
 * Identity + citation constants for Alley Tracker: Boilermaker Edition.
 *
 * Kept in one place so the page header, the PDF report and the credits can
 * never disagree about who wrote it, for which course, or whose method it is.
 * The author string matches the attribution used by the hub's other reports.
 */
export const PROJECT = {
  title: "Alley Tracker: Boilermaker Edition",
  subtitle: "Has Tornado Alley moved east? U.S. tornadoes, 1954–2024.",
  author: "Asrar ul Haq",
  courseLine: "Final Project, EAPS 225",
  instructor: "Professor Daniel Chavas",
  department: "Department of Earth, Atmospheric, and Planetary Sciences",
  university: "Purdue University",
  place: "West Lafayette, Indiana",
} as const;

/** The study this project re-does and extends. Credited on the page and in the PDF. */
export const PAPER_CREDIT = {
  authors: "Ernest Agee, Jennifer Larson, Samuel Childs and Alexandra Marmo",
  short: "Agee et al. (2016)",
  title:
    "Spatial Redistribution of U.S. Tornado Activity between 1954 and 2013",
  journal: "Journal of Applied Meteorology and Climatology, 55, 1681–1697",
  doi: "10.1175/JAMC-D-15-0342.1",
  url: "https://doi.org/10.1175/JAMC-D-15-0342.1",
  note: "Method, grid, periods and statistical tests are theirs; the code and the post-2013 extension are this project's.",
} as const;

export const REFERENCES: readonly string[] = [
  "Agee, E., J. Larson, S. Childs, and A. Marmo, 2016: Spatial redistribution of U.S. tornado activity between 1954 and 2013. J. Appl. Meteor. Climatol., 55, 1681–1697, doi:10.1175/JAMC-D-15-0342.1.",
  "Elmore, K. L., M. E. Baldwin, and D. M. Schultz, 2006: Field significance revisited: Spatial bias errors in forecasts as applied to the Eta Model. Mon. Wea. Rev., 134, 519–531, doi:10.1175/MWR3077.1.",
  "Livezey, R. E., and W. Y. Chen, 1983: Statistical field significance and its determination by Monte Carlo techniques. Mon. Wea. Rev., 111, 46–59.",
  "NOAA/NWS Storm Prediction Center: Severe Weather Database, 1950–2024 actual tornadoes (CSV). https://www.spc.noaa.gov/wcm/",
  "U.S. Census Bureau cartographic boundaries, via us-atlas 3.0.1 (ISC license), for state outlines.",
];

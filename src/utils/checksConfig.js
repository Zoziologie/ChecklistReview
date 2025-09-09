// eBird Checklist Validation Checks Configuration
// Based on the R script for identifying problematic eBird checklists

export const checksConfig = [
  {
    id: "high_number_species",
    label: "High species count",
    description:
      "Detects checklists with extremely high species counts that may indicate multi-day birding, list-building, or data entry errors.",
    selected: true,
    thresholds: [
      {
        key: "tooManySpecies",
        label: "Max species",
        description: "Flag checklists with more species than this limit",
        type: "number",
        defaultValue: 70,
        min: 1,
        step: 1,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // high_number_species = number_species > too_many_species
      return checklist.number_species > thresholds.tooManySpecies;
    },
    mail_template: (checklist, thresholds) =>
      `Your checklist reports a high number of species (${checklist.number_species}). Please confirm that this is not a multi-day list or a data entry error. If correct, no action is needed. Otherwise, consider splitting or correcting the checklist.\n\n`,
  },
  {
    id: "too_short_duration",
    label: "High species count relative to time",
    description:
      "Identifies checklists with an unrealistically high species-to-time ratio, suggesting rushed or incomplete data entry.",
    selected: true,
    thresholds: [
      {
        key: "maxSpeciesPerMinute",
        label: "Max species/min",
        description: "Flag when species count per minute exceeds this rate",
        type: "number",
        defaultValue: 10,
        min: 1,
        step: 1,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // too_short_duration = all_species_reported & number_species/duration_minutes > 10
      return (
        checklist.all_species_reported === true &&
        checklist.duration_minutes > 0 &&
        checklist.number_species / checklist.duration_minutes > thresholds.maxSpeciesPerMinute
      );
    },
    mail_template: (checklist, thresholds) =>
      `Your checklist reports a high species-to-time ratio (${checklist.number_species} species in ${checklist.duration_minutes} minutes). Please confirm that all species were observed and the duration is correct.\n\n`,
  },

  {
    id: "not_stationary",
    label: "High species count with stationary protocol",
    description:
      "Detects stationary protocol checklists with unusually high species counts that may suggest the observer was actually traveling.",
    selected: true,
    thresholds: [
      {
        key: "tooManySpeciesStationary",
        label: "Max species",
        description: "Flag stationary checklists with more species than this limit",
        type: "number",
        defaultValue: 50,
        min: 1,
        step: 1,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // not_stationary = protocol_name == "Stationary" & number_species > too_many_species_stationary
      return (
        checklist.protocol_name === "Stationary" &&
        checklist.number_species > thresholds.tooManySpeciesStationary
      );
    },
    mail_template: (checklist, thresholds) =>
      `Your stationary checklist reports a high number of species (${checklist.number_species}). Please confirm that the stationary protocol is appropriate, or consider using the traveling protocol if you moved during the checklist.\n\n`,
  },

  {
    id: "too_fast",
    label: "Unrealistic travel speed",
    description:
      "Calculates travel speed from distance and duration to identify checklists with impossible or unrealistic movement speeds.",
    selected: true,
    thresholds: [
      {
        key: "maxSpeedKmPerHour",
        label: "Max speed (km/h)",
        description: "Flag when calculated travel speed exceeds this limit",
        type: "number",
        defaultValue: 60,
        min: 1,
        step: 1,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // too_fast = effort_distance_km/duration_minutes*60 > 60
      return (
        checklist.duration_minutes > 0 &&
        (checklist.effort_distance_km / checklist.duration_minutes) * 60 >
          thresholds.maxSpeedKmPerHour
      );
    },
    mail_template: (checklist, thresholds) =>
      `Your checklist shows a calculated travel speed of ${(
        (checklist.effort_distance_km / checklist.duration_minutes) *
        60
      ).toFixed(2)} km/h, which is unusually high. Please verify the distance and/or duration.\n\n`,
  },

  {
    id: "same_count_all_species",
    label: "All species have identical counts",
    description:
      "Detects complete checklists where all species have the same count value, which may indicate data entry shortcuts or errors (counts should often be 'X' instead).",
    selected: true,
    thresholds: [
      {
        key: "minSpeciesForSameCount",
        label: "Min species",
        description: "Flag when this many or more species all have the same count",
        type: "number",
        defaultValue: 5,
        min: 1,
        step: 1,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // same_count_all_species = all_species_reported & median_count > 0 & number_unique_count == 1 & number_species > 5
      return (
        checklist.all_species_reported &&
        checklist.median_count > 0 &&
        checklist.number_unique_count === 1 &&
        checklist.number_species > thresholds.minSpeciesForSameCount
      );
    },
    mail_template: (checklist, thresholds) =>
      `Your checklist has all species with identical counts. This may indicate a data entry shortcut or error. Please review and update counts as needed, or use 'X' for presence-only records.\n\n`,
  },
  {
    id: "only_one_species",
    label: "Checklists with only one species",
    description:
      "Identifies complete daytime checklists reporting only a single species over a significant duration, possibly indicating the checklist should not be marked as complete.",
    selected: true,
    thresholds: [
      {
        key: "minDurationForSingleSpecies",
        label: "Min duration (min)",
        description:
          "Flag complete checklists with one species when duration exceeds this threshold",
        type: "number",
        defaultValue: 5,
        min: 1,
        step: 1,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // only_one_species = nocturnal == FALSE & all_species_reported & number_species == 1 & duration_minutes > 5
      return (
        !checklist.nocturnal &&
        checklist.all_species_reported &&
        checklist.number_species <= 1 &&
        checklist.duration_minutes > thresholds.minDurationForSingleSpecies
      );
    },
    mail_template: (checklist, thresholds) =>
      `Your checklist is marked as complete but only reports one species over ${checklist.duration_minutes} minutes. Please confirm if all species were reported, or if the checklist should not be marked as complete.\n\n`,
  },

  {
    id: "complete_media",
    label: "Mdia for every species",
    description:
      "Identifies complete checklists where every single species has associated media, which is unusually comprehensive and may indicate incomplete species reporting.",
    selected: true,
    thresholds: [],
    checkFunction: (checklist, thresholds) => {
      // complete_media = nocturnal == FALSE & all_species_reported & number_media == number_species
      return (
        checklist.nocturnal === false &&
        checklist.all_species_reported === true &&
        checklist.number_media === checklist.number_species
      );
    },
    mail_template: (checklist) =>
      `Your checklist is marked as complete and has media for every species. Please confirm that you indeed reported all species present, not only those with media. Otherwise, please change the checklist to "Incomplete".\n\n`,
  },

  {
    id: "midnight",
    label: "Starting at exactly midnight",
    description:
      "Flags checklists that start at exactly midnight (00:00), which is often incorrect timing as most birding doesn't start precisely at midnight.",
    selected: true,
    thresholds: [],
    checkFunction: (checklist, thresholds) => {
      // midnight = time_observations_started == hms(0, 0, 0)
      if (!checklist.time) return false;
      return (
        checklist.time === "00:00:00" || checklist.time === "00:00" || checklist.time === "0:00:00"
      );
    },
    mail_template: (checklist) =>
      `Your checklist starts at exactly midnight (${
        checklist.time ? checklist.time.slice(0, 5) : ""
      }). Please verify the start time, as most birding does not begin at midnight. If this is incorrect, update the time to reflect your actual start.\n\n`,
  },

  {
    id: "ampm",
    label: "High species count during the night",
    description: "Typically involves issues with AM/PM start time.",
    selected: true,
    thresholds: [
      {
        key: "minSpeciesForAmPm",
        label: "Min species",
        description: "Flag nighttime checklists when species count exceeds this threshold",
        type: "number",
        defaultValue: 10,
        min: 1,
        step: 1,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // ampm = nocturnal == TRUE & number_species > 10
      return (
        checklist.nocturnal === true && checklist.number_species > thresholds.minSpeciesForAmPm
      );
    },
    mail_template: (checklist) =>
      `We noticed that your checklist started at ${
        checklist.time ? checklist.time.slice(0, 5) : ""
      } and reported ${
        checklist.number_species
      } species. Since this is a nighttime checklist, it's possible that the AM/PM designation might be incorrect.\n\n`,
  },

  {
    id: "multi_day",
    label: "Checklists spanning multiple calendar days",
    description:
      "Identifies checklists where the start time plus duration extends past midnight into the next day, which violates eBird's single-day checklist rule.",
    selected: false,
    thresholds: [],
    checkFunction: (checklist, thresholds) => {
      // multi_day = nocturnal == FALSE & as.numeric(time_observations_started) + (duration_minutes * 60) > 86400
      if (!checklist.time_observations_started || checklist.nocturnal === true) return false;

      // Convert time to seconds from midnight
      const timeParts = checklist.time_observations_started.split(":");
      const startSeconds =
        parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + (parseInt(timeParts[2]) || 0);
      const endSeconds = startSeconds + checklist.duration_minutes * 60;

      return endSeconds > 86400; // 24 hours in seconds
    },
    mail_template: (checklist) =>
      `Your checklist appears to span multiple calendar days. eBird checklists should only cover a single day. Please split your checklist if it covers more than one day.\n\n`,
  },
  {
    id: "not_traveling",
    label: "Traveling checklists with minimal distance",
    description:
      "Identifies traveling protocol checklists with very short distances that should probably use the stationary protocol instead.",
    selected: false,
    thresholds: [
      {
        key: "maxTravelingDistanceKm",
        label: "Min distance (km)",
        description: "Flag traveling checklists with less distance than this threshold",
        type: "number",
        defaultValue: 0.03,
        min: 0,
        step: 0.01,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // not_traveling = protocol_name=="Traveling" & effort_distance_km < 0.03
      return (
        checklist.protocol_name === "Traveling" &&
        checklist.effort_distance_km < thresholds.maxTravelingDistanceKm
      );
    },
    mail_template: (checklist, thresholds) =>
      `Your traveling checklist covers a very short distance (${checklist.effort_distance_km} km). Below 30m, eBird suggests using the Stationary protocol. Please use the stationary protocol if relevant or correct the distance.\n\n`,
  },
  {
    id: "specialized_protocol",
    label: "Non-standard protocols",
    description:
      "Identifies checklists using specialized or uncommon protocols that may require additional review to ensure proper usage.",
    selected: false,
    thresholds: [],
    checkFunction: (checklist, thresholds) => {
      // specialized_protocol = !(protocol_name %in% c("Historical", "Traveling", "Incidental", "Stationary"))
      const standardProtocols = ["Historical", "Traveling", "Incidental", "Stationary"];
      return !standardProtocols.includes(checklist.protocol);
    },
    mail_template: (checklist) =>
      `Your checklist uses a specialized protocol. Please ensure that this protocol is appropriate for your birding activity.\n\n`,
  },
  {
    id: "no_observer_mismatch",
    label: "Shared checklists with observer count mismatch",
    description:
      "Detects checklists shared with more people than the number of observers indicated, suggesting potential data inconsistencies.",
    selected: false,
    thresholds: [],
    checkFunction: (checklist, thresholds) => {
      // no_observer_mismatch = ifelse(no_checklists > number_observers, TRUE, FALSE)
      return checklist.no_checklists > checklist.number_observers;
    },
    mail_template: (checklist) =>
      `Your checklist is shared with more people than the number of observers indicated. Please verify the observer count and sharing settings.\n\n`,
  },

  {
    id: "pelagic_too_long",
    label: "Pelagic checklists with excessive duration",
    description:
      "Flags pelagic protocol checklists that exceed the recommended maximum duration, which may indicate protocol misuse or data entry errors.",
    selected: false,
    thresholds: [
      {
        key: "maxPelagicDurationMinutes",
        label: "Max duration (min)",
        description: "Flag pelagic checklists longer than this duration",
        type: "number",
        defaultValue: 75,
        min: 1,
        step: 1,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // pelagic_too_long = ifelse(protocol_name == "eBird Pelagic Protocol" & duration_minutes > 75, TRUE, FALSE)
      return (
        checklist.protocol_name === "eBird Pelagic Protocol" &&
        checklist.duration_minutes > thresholds.maxPelagicDurationMinutes
      );
    },
    mail_template: (checklist, thresholds) =>
      `Your pelagic checklist has a duration of ${checklist.duration_minutes} minutes, which exceeds the recommended maximum. Please review the duration and split the checklist if necessary.\n\n`,
  },

  /*{
    id: "too_many_observers",
    label: "Excessive number of observers",
    description:
      "Flags checklists with an unusually high number of observers, which may indicate multi-party birding that should be submitted as separate checklists.",
    selected: true,
    thresholds: [
      {
        key: "tooManyObservers",
        label: "Max observers",
        description: "Flag checklists with more observers than this limit",
        type: "number",
        defaultValue: 20,
        min: 1,
        step: 1,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // too_many_observers = number_observers > too_many_observers
      return checklist.number_observers > thresholds.tooManyObservers;
    },
    mail_template: (checklist, thresholds) =>
      `Your checklist lists ${checklist.number_observers} observers, which is unusually high. Please ensure that each party submits their own checklist, or confirm that the observer count is correct.\n\n`,
  },*/
  /*{
    id: "too_long_distance_land",
    label: "Land checklists with excessive distance",
    description:
      "Flags land-based checklists with distances that exceed reasonable limits for terrestrial birding activities.",
    selected: true,
    thresholds: [
      {
        key: "tooLongLand",
        label: "Max distance (km)",
        description: "Flag land checklists with distance exceeding this limit",
        type: "number",
        defaultValue: 20,
        min: 1,
        step: 1,
      },
    ],
    checkFunction: (checklist, thresholds) => {
      // too_long_distance_land = ifelse(!is.na(continent) & effort_distance_km > too_long_land, TRUE, FALSE)
      return (
        checklist.continent != null &&
        checklist.continent !== "" &&
        checklist.effort_distance_km > thresholds.tooLongLand
      );
    },
    mail_template: (checklist, thresholds) =>
      `Your land-based checklist covers a distance of ${checklist.effort_distance_km} km, which exceeds the recommended maximum. Please review the distance and split the checklist if necessary.\n\n`,
  },*/
];

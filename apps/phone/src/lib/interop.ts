import {
  type Exercise,
  ExerciseSchema,
  normalizeExerciseTitle,
  type Plan,
  PlanSchema,
  SCHEMA_VERSION,
  type Workout,
  WorkoutSchema,
} from "@spotter/domain";
import { workoutSetCount, workoutVolumeKg } from "./workout";

export class SchemaVersionError extends Error {
  constructor(
    readonly expected: number,
    readonly found: unknown,
  ) {
    super(
      `Unsupported schemaVersion: expected ${expected}, found ${String(found)}. ` +
        "Download the current template and convert the file to this version.",
    );
  }
}

export class ImportFormatError extends Error {}

// ---------------------------------------------------------------- Plan JSON

export interface PlanExport {
  schemaVersion: number;
  plan: Plan;
  exercises: Exercise[];
}

export const collectPlanExerciseIds = (plan: Plan): string[] => {
  const ids = new Set<string>();
  for (const routine of plan.routines) {
    for (const module of routine.modules) {
      for (const item of module.items) {
        if (item.kind === "exercise") {
          ids.add(item.exerciseId);
        } else {
          for (const member of item.members) ids.add(member.exerciseId);
        }
      }
    }
  }
  return [...ids];
};

/** Self-contained template export: the Plan plus copies of every Exercise it references. */
export const buildPlanExport = (
  plan: Plan,
  library: Exercise[],
): PlanExport => {
  const byId = new Map(library.map((exercise) => [exercise.id, exercise]));
  const ids = collectPlanExerciseIds(PlanSchema.parse(plan));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new ImportFormatError(
      `Cannot export: missing Exercises ${missing.join(", ")}.`,
    );
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    plan: PlanSchema.parse(plan),
    exercises: ids
      .map((id) => byId.get(id))
      .filter((exercise): exercise is Exercise => !!exercise),
  };
};

export const serializePlanExport = (data: PlanExport): string =>
  `${JSON.stringify(data, null, 2)}\n`;

export const parsePlanExport = (
  record: Record<string, unknown>,
): PlanExport => {
  if (typeof record !== "object" || record === null) {
    throw new ImportFormatError("The file is not a Plan export.");
  }
  if (record.schemaVersion !== SCHEMA_VERSION) {
    throw new SchemaVersionError(SCHEMA_VERSION, record.schemaVersion);
  }
  if (!Array.isArray(record.exercises)) {
    throw new ImportFormatError("The file has no Exercises array.");
  }
  const exercises = record.exercises.map((exercise) =>
    ExerciseSchema.parse(exercise),
  );
  const plan = PlanSchema.parse(record.plan);
  return { schemaVersion: SCHEMA_VERSION, plan, exercises };
};

export type ExerciseMergeMode = "create" | "update" | "merge";

export interface ExerciseChange {
  imported: Exercise;
  localId: string;
  mode: ExerciseMergeMode;
  existing?: Exercise;
}

export interface PlanImportPreview {
  plan: Plan;
  exerciseChanges: ExerciseChange[];
}

const remapPlan = (plan: Plan, remap: Map<string, string>): Plan =>
  PlanSchema.parse({
    ...plan,
    routines: plan.routines.map((routine) => ({
      ...routine,
      modules: routine.modules.map((module) => ({
        ...module,
        items: module.items.map((item) =>
          item.kind === "exercise"
            ? {
                ...item,
                exerciseId: remap.get(item.exerciseId) ?? item.exerciseId,
              }
            : {
                ...item,
                members: item.members.map((member) => ({
                  ...member,
                  exerciseId: remap.get(member.exerciseId) ?? member.exerciseId,
                })),
              },
        ),
      })),
    })),
  });

/**
 * Parse and resolve Exercise identity without writing anything: by id first,
 * then by unique title (merged into the existing Exercise), else create.
 */
export const preparePlanImport = (
  record: Record<string, unknown>,
  library: Exercise[],
): PlanImportPreview => {
  const data = parsePlanExport(record);
  const byId = new Map(library.map((exercise) => [exercise.id, exercise]));
  const byTitle = new Map(
    library.map((exercise) => [
      normalizeExerciseTitle(exercise.title),
      exercise,
    ]),
  );
  const remap = new Map<string, string>();
  const exerciseChanges: ExerciseChange[] = [];

  for (const imported of data.exercises) {
    const idMatch = byId.get(imported.id);
    if (idMatch) {
      remap.set(imported.id, idMatch.id);
      exerciseChanges.push({
        imported,
        localId: idMatch.id,
        mode: "update",
        existing: idMatch,
      });
      continue;
    }
    const titleMatch = byTitle.get(normalizeExerciseTitle(imported.title));
    if (titleMatch) {
      remap.set(imported.id, titleMatch.id);
      exerciseChanges.push({
        imported,
        localId: titleMatch.id,
        mode: "merge",
        existing: titleMatch,
      });
      continue;
    }
    remap.set(imported.id, imported.id);
    exerciseChanges.push({ imported, localId: imported.id, mode: "create" });
  }

  return { plan: remapPlan(data.plan, remap), exerciseChanges };
};

export const commitPlanImport = (
  preview: PlanImportPreview,
  saveExercise: (exercise: Exercise) => void,
  savePlan: (plan: Plan) => void,
): Plan => {
  for (const change of preview.exerciseChanges) {
    if (change.mode === "merge") continue;
    saveExercise({ ...change.imported, id: change.localId });
  }
  savePlan(preview.plan);
  return preview.plan;
};

// --------------------------------------------------------------------- CSV

export const CSV_HEADER = [
  "schemaVersion",
  "workoutId",
  "planId",
  "planName",
  "routineId",
  "routineName",
  "startedAt",
  "durationSeconds",
  "exerciseCount",
  "setCount",
  "totalVolumeKg",
  "details",
] as const;

/** RFC 4180 field quoting. */
export const csvEscape = (value: string): string =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const durationSeconds = (workout: Workout): number =>
  Math.max(
    0,
    Math.round(
      (Date.parse(workout.endedAt) - Date.parse(workout.startedAt)) / 1000,
    ),
  );

const exerciseCount = (workout: Workout): number =>
  workout.exercises.reduce(
    (total, entry) =>
      total + (entry.kind === "exercise" ? 1 : entry.members.length),
    0,
  );

export const workoutToCsvRow = (workout: Workout): string =>
  [
    String(SCHEMA_VERSION),
    workout.workoutId,
    workout.planId,
    workout.planName,
    workout.routineId,
    workout.routineName,
    workout.startedAt,
    String(durationSeconds(workout)),
    String(exerciseCount(workout)),
    String(workoutSetCount(workout)),
    String(workoutVolumeKg(workout)),
    JSON.stringify(workout),
  ]
    .map(csvEscape)
    .join(",");

export const exportWorkoutsCsv = (workouts: Workout[]): string =>
  [CSV_HEADER.join(","), ...workouts.map(workoutToCsvRow)].join("\r\n");

/** Minimal RFC 4180 reader: quotes, doubled quotes, embedded commas/newlines. */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      if (text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stable(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

export interface WorkoutImportPreview {
  accepted: Workout[];
  skipped: string[];
  conflicts: { workout: Workout; existing: Workout }[];
}

/**
 * Trust `details`, ignore the summary columns, enforce the exact version, then
 * dedupe by id. Same id + same content skips; same id + different content is a
 * keep-existing conflict (ADR 0037). Nothing is written here.
 */
export const prepareWorkoutsCsvImport = (
  text: string,
  existing: Workout[],
): WorkoutImportPreview => {
  const rows = parseCsv(text);
  const header = rows.shift();
  if (!header || header.join(",") !== CSV_HEADER.join(",")) {
    throw new ImportFormatError(
      "The CSV header does not match the current log format.",
    );
  }

  const existingById = new Map(
    existing.map((workout) => [workout.workoutId, workout]),
  );
  const accepted: Workout[] = [];
  const skipped: string[] = [];
  const conflicts: { workout: Workout; existing: Workout }[] = [];
  const seen = new Map<string, Workout>();

  for (const row of rows) {
    if (row.length === 1 && row[0] === "") continue;
    if (row.length !== CSV_HEADER.length) {
      throw new ImportFormatError("A CSV row has the wrong number of columns.");
    }
    const version = Number(row[0]);
    if (version !== SCHEMA_VERSION)
      throw new SchemaVersionError(SCHEMA_VERSION, row[0]);

    let workout: Workout;
    try {
      workout = WorkoutSchema.parse(
        JSON.parse(row[CSV_HEADER.length - 1] ?? ""),
      );
    } catch {
      throw new ImportFormatError(
        `Workout ${row[1] ?? "?"} has invalid details JSON.`,
      );
    }

    const local =
      existingById.get(workout.workoutId) ?? seen.get(workout.workoutId);
    if (local) {
      if (stable(local) === stable(workout)) {
        skipped.push(workout.workoutId);
      } else {
        conflicts.push({ workout, existing: local });
      }
      continue;
    }
    seen.set(workout.workoutId, workout);
    accepted.push(workout);
  }

  return { accepted, skipped, conflicts };
};

export const commitWorkoutsImport = (
  preview: WorkoutImportPreview,
  saveWorkout: (workout: Workout) => void,
): number => {
  for (const workout of preview.accepted) saveWorkout(workout);
  return preview.accepted.length;
};

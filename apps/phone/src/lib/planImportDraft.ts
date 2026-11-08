import type { Exercise, Plan } from '@spotter/domain';
import type { PlanImportPreview } from './interop';

/** Route id for an unsaved Plan editor draft; saved Plan ids are UUIDv7. */
export const PLAN_DRAFT_ID = 'plan-draft';

export type PlanDraftKind = 'import' | 'duplicate';

let draft: PlanImportPreview | null = null;
let draftKind: PlanDraftKind | null = null;

export const startPlanImportDraft = (preview: PlanImportPreview): void => {
  draft = preview;
  draftKind = 'import';
};

export const startPlanDuplicateDraft = (plan: Plan): void => {
  draft = { plan, exerciseChanges: [] };
  draftKind = 'duplicate';
};

export const getPlanImportDraft = (): PlanImportPreview | null => draft;

export const getPlanDraftKind = (): PlanDraftKind | null => draftKind;

export const updatePlanImportDraft = (plan: Plan): void => {
  if (draft) draft = { ...draft, plan };
};

export const clearPlanImportDraft = (): void => {
  draft = null;
  draftKind = null;
};

/** Exercises a draft Plan refers to, under the local ids they are saved with on commit. */
export const planImportDraftExercises = (preview: PlanImportPreview): Exercise[] =>
  preview.exerciseChanges.map((change) => ({
    ...(change.mode === 'merge' && change.existing ? change.existing : change.imported),
    id: change.localId,
  }));

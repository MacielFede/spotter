import type { Exercise, Plan } from '@spotter/domain';
import { describe, expect, it } from 'vitest';
import type { PlanImportPreview } from './interop';
import {
  clearPlanImportDraft,
  getPlanDraftKind,
  getPlanImportDraft,
  planImportDraftExercises,
  startPlanDuplicateDraft,
  startPlanImportDraft,
  updatePlanImportDraft,
} from './planImportDraft';

const IMPORTED = '0193a1b2-c3d4-7e5f-89ab-cdef01234567';
const LOCAL = '0193a1b2-c3d4-7e5f-89ab-cdef01234568';
const PLAN_ID = '0193a1b2-c3d4-7e5f-89ab-cdef0123456c';

const exercise = (id: string, title: string): Exercise => ({
  id,
  title,
  description: '',
  usesWeight: true,
  archived: false,
});

const plan: Plan = { id: PLAN_ID, name: 'Imported', routines: [] };

describe('planImportDraftExercises', () => {
  it('uses the imported content for create and update, and the existing content for merge', () => {
    const preview: PlanImportPreview = {
      plan,
      exerciseChanges: [
        {
          imported: exercise(IMPORTED, 'Bench Press'),
          localId: IMPORTED,
          mode: 'create',
        },
        {
          imported: exercise(IMPORTED, 'Row (file)'),
          localId: IMPORTED,
          mode: 'update',
          existing: exercise(IMPORTED, 'Row'),
        },
        {
          imported: exercise('0193a1b2-c3d4-7e5f-89ab-cdef0123456a', 'Squat (file)'),
          localId: LOCAL,
          mode: 'merge',
          existing: exercise(LOCAL, 'Squat'),
        },
      ],
    };

    expect(planImportDraftExercises(preview).map((item) => [item.id, item.title])).toEqual([
      [IMPORTED, 'Bench Press'],
      [IMPORTED, 'Row (file)'],
      [LOCAL, 'Squat'],
    ]);
  });
});

describe('plan editor draft store', () => {
  it('holds the draft until it is updated or cleared', () => {
    const preview: PlanImportPreview = { plan, exerciseChanges: [] };
    startPlanImportDraft(preview);
    expect(getPlanImportDraft()).toBe(preview);
    expect(getPlanDraftKind()).toBe('import');

    const renamed = { ...plan, name: 'Renamed' };
    updatePlanImportDraft(renamed);
    expect(getPlanImportDraft()?.plan.name).toBe('Renamed');

    clearPlanImportDraft();
    expect(getPlanImportDraft()).toBeNull();
    expect(getPlanDraftKind()).toBeNull();
  });

  it('stores a duplicate as an unsaved Plan draft without importing Exercises', () => {
    const duplicate: Plan = { ...plan, id: LOCAL, name: 'Copy of Imported' };
    startPlanDuplicateDraft(duplicate);

    expect(getPlanImportDraft()).toEqual({ plan: duplicate, exerciseChanges: [] });
    expect(getPlanDraftKind()).toBe('duplicate');

    clearPlanImportDraft();
  });
});

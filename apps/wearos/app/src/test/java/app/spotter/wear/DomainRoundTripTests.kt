package app.spotter.wear

import app.spotter.domain.Exercise
import app.spotter.domain.Workout
import app.spotter.domain.mapper as domainMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.readValue
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Round-trips the generated Jackson models (ADR 0045) — the Wear OS half of
 * the codegen acceptance deferred from issue #14. The generated entities are
 * raw (no `schemaVersion`) — the envelope lives on the Domain root, matching
 * the combined codegen input. The mapper is the generated one — it carries the
 * custom (de)serializers for the enum wire values — plus JavaTimeModule for the
 * generated OffsetDateTime fields: exactly what the hand-written mapping layer
 * (ADR 0045) sets up app-side.
 */
class DomainRoundTripTests {
    private val mapper = domainMapper.registerModule(JavaTimeModule())

    @Test
    fun exerciseRoundTrip() {
        val json =
            """{"id":"0193a1b2-c3d4-7e5f-89ab-cdef01234567","title":"Bench Press","description":"","archived":false}"""
        val first: Exercise = mapper.readValue(json)
        val second: Exercise = mapper.readValue(mapper.writeValueAsString(first))
        assertEquals(first, second)
    }

    @Test
    fun workoutRoundTrip() {
        val json =
            """{"workoutId":"0193a1b2-c3d4-7e5f-89ab-cdef01234567","planId":"0193a1b2-c3d4-7e5f-89ab-cdef01234568","planName":"Hypertrophy","routineId":"0193a1b2-c3d4-7e5f-89ab-cdef01234569","routineName":"Push Day A","startedAt":"2026-10-12T18:30:00+02:00","endedAt":"2026-10-12T19:35:00+02:00","startedOn":"phone","exercises":[{"kind":"exercise","exerciseId":"0193a1b2-c3d4-7e5f-89ab-cdef01234567","title":"Bench Press","description":"","module":"core","rounds":1,"sets":[{"mode":"reps","targetReps":8,"weightKg":60,"restSeconds":90,"actualReps":8,"actualWeightKg":60}]}]}"""
        val first: Workout = mapper.readValue(json)
        val second: Workout = mapper.readValue(mapper.writeValueAsString(first))
        // Field-by-field: the generated `Rounds` union wrapper has no equals().
        assertEquals(first.workoutID, second.workoutID)
        assertEquals(first.planID, second.planID)
        assertEquals(first.planName, second.planName)
        assertEquals(first.routineID, second.routineID)
        assertEquals(first.routineName, second.routineName)
        assertEquals(first.startedAt, second.startedAt)
        assertEquals(first.endedAt, second.endedAt)
        assertEquals(first.startedOn, second.startedOn)
        assertEquals(first.exercises.first()?.title, second.exercises.first()?.title)
        assertEquals(first.exercises.first()?.sets?.first()?.actualReps, second.exercises.first()?.sets?.first()?.actualReps)
        assertEquals(first.exercises.first()?.sets?.first()?.actualWeightKg, second.exercises.first()?.sets?.first()?.actualWeightKg)
    }
}

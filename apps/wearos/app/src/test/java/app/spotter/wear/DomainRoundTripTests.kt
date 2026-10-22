package app.spotter.wear

import app.spotter.domain.Exercise
import app.spotter.domain.Workout
import java.io.File
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

    private fun fixture(name: String): String {
        val candidates =
            listOf(
                File("../../../packages/domain/fixtures/$name"),
                File("../../packages/domain/fixtures/$name"),
                File("packages/domain/fixtures/$name"),
            )
        val file = candidates.firstOrNull { it.exists() }
            ?: error("Shared fixture not found: $name (looked in ${candidates.joinToString()})")
        return file.readText()
    }

    @Test
    fun exerciseRoundTrip() {
        val json = fixture("exercise.json")
        val first: Exercise = mapper.readValue(json)
        val second: Exercise = mapper.readValue(mapper.writeValueAsString(first))
        assertEquals(first, second)
    }

    @Test
    fun workoutRoundTrip() {
        val json = fixture("workout.json")
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
        assertEquals(first.exercises.size, second.exercises.size)
        assertEquals(first.exercises.first()?.title, second.exercises.first()?.title)
        assertEquals(first.exercises.first()?.sets?.size, second.exercises.first()?.sets?.size)
        assertEquals(first.exercises.first()?.sets?.first()?.mode, second.exercises.first()?.sets?.first()?.mode)
        assertEquals(first.exercises.first()?.sets?.first()?.targetReps, second.exercises.first()?.sets?.first()?.targetReps)
        assertEquals(first.exercises.first()?.sets?.first()?.actualReps, second.exercises.first()?.sets?.first()?.actualReps)
        assertEquals(first.exercises.first()?.sets?.first()?.actualWeightKg, second.exercises.first()?.sets?.first()?.actualWeightKg)
    }
}

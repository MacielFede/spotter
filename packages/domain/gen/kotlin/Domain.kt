// To parse the JSON, install jackson-module-kotlin and do:
//
//   val domain = Domain.fromJson(jsonString)

package app.spotter.domain

import java.time.OffsetDateTime

import com.fasterxml.jackson.annotation.*
import com.fasterxml.jackson.core.*
import com.fasterxml.jackson.databind.*
import com.fasterxml.jackson.databind.deser.std.StdDeserializer
import com.fasterxml.jackson.databind.module.SimpleModule
import com.fasterxml.jackson.databind.node.*
import com.fasterxml.jackson.databind.ser.std.StdSerializer
import com.fasterxml.jackson.module.kotlin.*


@Suppress("UNCHECKED_CAST")
private fun <T> ObjectMapper.convert(k: kotlin.reflect.KClass<*>, fromJson: (JsonNode) -> T, toJson: (T) -> String, isUnion: Boolean = false) = registerModule(SimpleModule().apply {
    addSerializer(k.java as Class<T>, object : StdSerializer<T>(k.java as Class<T>) {
            override fun serialize(value: T, gen: JsonGenerator, provider: SerializerProvider) = gen.writeRawValue(toJson(value))
    })
    addDeserializer(k.java as Class<T>, object : StdDeserializer<T>(k.java as Class<T>) {
            override fun deserialize(p: JsonParser, ctxt: DeserializationContext) = fromJson(p.readValueAsTree())
    })
})

val mapper = jacksonObjectMapper().apply {
    propertyNamingStrategy = PropertyNamingStrategy.LOWER_CAMEL_CASE
    setSerializationInclusion(JsonInclude.Include.NON_NULL)
    convert(OffsetDateTime::class, { OffsetDateTime.parse(it.asText()) }, { "\"${java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(it)}\"" })
    convert(Kind::class,           { Kind.fromValue(it.asText()) },       { "\"${it.value}\"" })
    convert(Mode::class,           { Mode.fromValue(it.asText()) },       { "\"${it.value}\"" })
    convert(ModuleKind::class,     { ModuleKind.fromValue(it.asText()) }, { "\"${it.value}\"" })
    convert(StartedOn::class,      { StartedOn.fromValue(it.asText()) },  { "\"${it.value}\"" })
    convert(Rounds::class,         { Rounds.fromJson(it) },               { it.toJson() }, true)
}

data class Domain (
    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val exercise: Exercise,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val plan: Plan,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val schemaVersion: Double,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val workout: Workout
) {
    fun toJson() = mapper.writeValueAsString(this)

    companion object {
        fun fromJson(json: String) = mapper.readValue<Domain>(json)
    }
}

data class Exercise (
    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val archived: Boolean,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val description: String,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val id: String,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val title: String
)

data class Plan (
    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val id: String,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val name: String,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val routines: List<Routine>
)

data class Routine (
    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val active: Boolean,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val id: String,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val modules: List<Module>,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val name: String
)

data class Module (
    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val enabled: Boolean,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val items: List<Item>,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val kind: ModuleKind
)

data class Item (
    @get:JsonProperty("exerciseId")@field:JsonProperty("exerciseId")
    val exerciseID: String? = null,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val kind: Kind,

    val sets: List<Set>? = null,
    val members: List<SupersetMember>? = null,
    val restSeconds: Long? = null,
    val rounds: Long? = null
)

enum class Kind(val value: String) {
    Exercise("exercise"),
    Superset("superset");

    companion object {
        fun fromValue(value: String): Kind = when (value) {
            "exercise" -> Exercise
            "superset" -> Superset
            else       -> throw IllegalArgumentException()
        }
    }
}

data class SupersetMember (
    @get:JsonProperty("exerciseId", required=true)@field:JsonProperty("exerciseId", required=true)
    val exerciseID: String,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val set: SupersetMemberSet
)

data class SupersetMemberSet (
    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val mode: Mode,

    val targetReps: Long? = null,
    val weightKg: Double? = null,
    val targetSeconds: Long? = null
)

enum class Mode(val value: String) {
    Reps("reps"),
    Time("time");

    companion object {
        fun fromValue(value: String): Mode = when (value) {
            "reps" -> Reps
            "time" -> Time
            else   -> throw IllegalArgumentException()
        }
    }
}

data class Set (
    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val mode: Mode,

    val restSeconds: Long? = null,
    val targetReps: Long? = null,
    val weightKg: Double? = null,
    val targetSeconds: Long? = null
)

enum class ModuleKind(val value: String) {
    Cardio("cardio"),
    Core("core"),
    Stretching("stretching"),
    Warmup("warmup");

    companion object {
        fun fromValue(value: String): ModuleKind = when (value) {
            "cardio"     -> Cardio
            "core"       -> Core
            "stretching" -> Stretching
            "warmup"     -> Warmup
            else         -> throw IllegalArgumentException()
        }
    }
}

data class Workout (
    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val endedAt: OffsetDateTime,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val exercises: List<WorkoutEntry>,

    @get:JsonProperty("planId", required=true)@field:JsonProperty("planId", required=true)
    val planID: String,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val planName: String,

    @get:JsonProperty("routineId", required=true)@field:JsonProperty("routineId", required=true)
    val routineID: String,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val routineName: String,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val startedAt: OffsetDateTime,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val startedOn: StartedOn,

    @get:JsonProperty("workoutId", required=true)@field:JsonProperty("workoutId", required=true)
    val workoutID: String
)

data class WorkoutEntry (
    val description: String? = null,

    @get:JsonProperty("exerciseId")@field:JsonProperty("exerciseId")
    val exerciseID: String? = null,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val kind: Kind,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val module: ModuleKind,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val rounds: Rounds,

    val sets: List<LoggedSet>? = null,
    val title: String? = null,
    val members: List<SupersetMemberSnapshot>? = null,
    val restSeconds: Long? = null
)

data class SupersetMemberSnapshot (
    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val actuals: List<SupersetMemberActual>,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val description: String,

    @get:JsonProperty("exerciseId", required=true)@field:JsonProperty("exerciseId", required=true)
    val exerciseID: String,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val set: SupersetMemberSet,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val title: String
)

data class SupersetMemberActual (
    val actualReps: Long? = null,
    val actualWeightKg: Double? = null,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val mode: Mode,

    val actualSeconds: Long? = null
)

sealed class Rounds {
    class DoubleValue(val value: Double) : Rounds()
    class IntegerValue(val value: Long)  : Rounds()

    fun toJson(): String = mapper.writeValueAsString(when (this) {
        is DoubleValue  -> this.value
        is IntegerValue -> this.value
    })

    companion object {
        fun fromJson(jn: JsonNode): Rounds = when (jn) {
            is DoubleNode           -> DoubleValue(mapper.treeToValue(jn))
            is IntNode, is LongNode -> IntegerValue(mapper.treeToValue(jn))
            else                    -> throw IllegalArgumentException()
        }
    }
}

data class LoggedSet (
    val actualReps: Long? = null,
    val actualWeightKg: Double? = null,

    @get:JsonProperty(required=true)@field:JsonProperty(required=true)
    val mode: Mode,

    val restSeconds: Long? = null,
    val targetReps: Long? = null,
    val weightKg: Double? = null,
    val actualSeconds: Long? = null,
    val targetSeconds: Long? = null
)

enum class StartedOn(val value: String) {
    Phone("phone"),
    Watch("watch");

    companion object {
        fun fromValue(value: String): StartedOn = when (value) {
            "phone" -> Phone
            "watch" -> Watch
            else    -> throw IllegalArgumentException()
        }
    }
}

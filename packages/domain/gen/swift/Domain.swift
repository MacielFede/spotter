// This file was generated from JSON Schema using quicktype, do not modify it directly.
// To parse the JSON, add this file to your project and do:
//
//   let domain = try Domain(json)

import Foundation

// MARK: - Domain
struct Domain: Codable {
    let exercise: Exercise
    let plan: Plan
    let schemaVersion: Double
    let workout: Workout

    enum CodingKeys: String, CodingKey {
        case exercise = "exercise"
        case plan = "plan"
        case schemaVersion = "schemaVersion"
        case workout = "workout"
    }
}

// MARK: Domain convenience initializers and mutators

extension Domain {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Domain.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        exercise: Exercise? = nil,
        plan: Plan? = nil,
        schemaVersion: Double? = nil,
        workout: Workout? = nil
    ) -> Domain {
        return Domain(
            exercise: exercise ?? self.exercise,
            plan: plan ?? self.plan,
            schemaVersion: schemaVersion ?? self.schemaVersion,
            workout: workout ?? self.workout
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Exercise
struct Exercise: Codable {
    let archived: Bool
    let description: String
    let id: String
    let title: String

    enum CodingKeys: String, CodingKey {
        case archived = "archived"
        case description = "description"
        case id = "id"
        case title = "title"
    }
}

// MARK: Exercise convenience initializers and mutators

extension Exercise {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Exercise.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        archived: Bool? = nil,
        description: String? = nil,
        id: String? = nil,
        title: String? = nil
    ) -> Exercise {
        return Exercise(
            archived: archived ?? self.archived,
            description: description ?? self.description,
            id: id ?? self.id,
            title: title ?? self.title
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Plan
struct Plan: Codable {
    let id: String
    let name: String
    let routines: [Routine]

    enum CodingKeys: String, CodingKey {
        case id = "id"
        case name = "name"
        case routines = "routines"
    }
}

// MARK: Plan convenience initializers and mutators

extension Plan {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Plan.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        id: String? = nil,
        name: String? = nil,
        routines: [Routine]? = nil
    ) -> Plan {
        return Plan(
            id: id ?? self.id,
            name: name ?? self.name,
            routines: routines ?? self.routines
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Routine
struct Routine: Codable {
    let active: Bool
    let id: String
    let modules: [Module]
    let name: String

    enum CodingKeys: String, CodingKey {
        case active = "active"
        case id = "id"
        case modules = "modules"
        case name = "name"
    }
}

// MARK: Routine convenience initializers and mutators

extension Routine {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Routine.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        active: Bool? = nil,
        id: String? = nil,
        modules: [Module]? = nil,
        name: String? = nil
    ) -> Routine {
        return Routine(
            active: active ?? self.active,
            id: id ?? self.id,
            modules: modules ?? self.modules,
            name: name ?? self.name
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Module
struct Module: Codable {
    let enabled: Bool
    let items: [Item]
    let kind: ModuleKind

    enum CodingKeys: String, CodingKey {
        case enabled = "enabled"
        case items = "items"
        case kind = "kind"
    }
}

// MARK: Module convenience initializers and mutators

extension Module {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Module.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        enabled: Bool? = nil,
        items: [Item]? = nil,
        kind: ModuleKind? = nil
    ) -> Module {
        return Module(
            enabled: enabled ?? self.enabled,
            items: items ?? self.items,
            kind: kind ?? self.kind
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - Item
struct Item: Codable {
    let exerciseID: String?
    let kind: Kind
    let sets: [Set]?
    let members: [SupersetMember]?
    let restSeconds: Int?
    let rounds: Int?

    enum CodingKeys: String, CodingKey {
        case exerciseID = "exerciseId"
        case kind = "kind"
        case sets = "sets"
        case members = "members"
        case restSeconds = "restSeconds"
        case rounds = "rounds"
    }
}

// MARK: Item convenience initializers and mutators

extension Item {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Item.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        exerciseID: String?? = nil,
        kind: Kind? = nil,
        sets: [Set]?? = nil,
        members: [SupersetMember]?? = nil,
        restSeconds: Int?? = nil,
        rounds: Int?? = nil
    ) -> Item {
        return Item(
            exerciseID: exerciseID ?? self.exerciseID,
            kind: kind ?? self.kind,
            sets: sets ?? self.sets,
            members: members ?? self.members,
            restSeconds: restSeconds ?? self.restSeconds,
            rounds: rounds ?? self.rounds
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

enum Kind: String, Codable {
    case exercise = "exercise"
    case superset = "superset"
}

// MARK: - SupersetMember
struct SupersetMember: Codable {
    let exerciseID: String
    let supersetMemberSet: SupersetMemberSet

    enum CodingKeys: String, CodingKey {
        case exerciseID = "exerciseId"
        case supersetMemberSet = "set"
    }
}

// MARK: SupersetMember convenience initializers and mutators

extension SupersetMember {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(SupersetMember.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        exerciseID: String? = nil,
        supersetMemberSet: SupersetMemberSet? = nil
    ) -> SupersetMember {
        return SupersetMember(
            exerciseID: exerciseID ?? self.exerciseID,
            supersetMemberSet: supersetMemberSet ?? self.supersetMemberSet
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - SupersetMemberSet
struct SupersetMemberSet: Codable {
    let mode: Mode
    let targetReps: Int?
    let weightKg: Double?
    let targetSeconds: Int?

    enum CodingKeys: String, CodingKey {
        case mode = "mode"
        case targetReps = "targetReps"
        case weightKg = "weightKg"
        case targetSeconds = "targetSeconds"
    }
}

// MARK: SupersetMemberSet convenience initializers and mutators

extension SupersetMemberSet {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(SupersetMemberSet.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        mode: Mode? = nil,
        targetReps: Int?? = nil,
        weightKg: Double?? = nil,
        targetSeconds: Int?? = nil
    ) -> SupersetMemberSet {
        return SupersetMemberSet(
            mode: mode ?? self.mode,
            targetReps: targetReps ?? self.targetReps,
            weightKg: weightKg ?? self.weightKg,
            targetSeconds: targetSeconds ?? self.targetSeconds
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

enum Mode: String, Codable {
    case reps = "reps"
    case time = "time"
}

// MARK: - Set
struct Set: Codable {
    let mode: Mode
    let restSeconds: Int?
    let targetReps: Int?
    let weightKg: Double?
    let targetSeconds: Int?

    enum CodingKeys: String, CodingKey {
        case mode = "mode"
        case restSeconds = "restSeconds"
        case targetReps = "targetReps"
        case weightKg = "weightKg"
        case targetSeconds = "targetSeconds"
    }
}

// MARK: Set convenience initializers and mutators

extension Set {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Set.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        mode: Mode? = nil,
        restSeconds: Int?? = nil,
        targetReps: Int?? = nil,
        weightKg: Double?? = nil,
        targetSeconds: Int?? = nil
    ) -> Set {
        return Set(
            mode: mode ?? self.mode,
            restSeconds: restSeconds ?? self.restSeconds,
            targetReps: targetReps ?? self.targetReps,
            weightKg: weightKg ?? self.weightKg,
            targetSeconds: targetSeconds ?? self.targetSeconds
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

enum ModuleKind: String, Codable {
    case cardio = "cardio"
    case core = "core"
    case stretching = "stretching"
    case warmup = "warmup"
}

// MARK: - Workout
struct Workout: Codable {
    let endedAt: Date
    let exercises: [WorkoutEntry]
    let planID: String
    let planName: String
    let routineID: String
    let routineName: String
    let startedAt: Date
    let startedOn: StartedOn
    let workoutID: String

    enum CodingKeys: String, CodingKey {
        case endedAt = "endedAt"
        case exercises = "exercises"
        case planID = "planId"
        case planName = "planName"
        case routineID = "routineId"
        case routineName = "routineName"
        case startedAt = "startedAt"
        case startedOn = "startedOn"
        case workoutID = "workoutId"
    }
}

// MARK: Workout convenience initializers and mutators

extension Workout {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(Workout.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        endedAt: Date? = nil,
        exercises: [WorkoutEntry]? = nil,
        planID: String? = nil,
        planName: String? = nil,
        routineID: String? = nil,
        routineName: String? = nil,
        startedAt: Date? = nil,
        startedOn: StartedOn? = nil,
        workoutID: String? = nil
    ) -> Workout {
        return Workout(
            endedAt: endedAt ?? self.endedAt,
            exercises: exercises ?? self.exercises,
            planID: planID ?? self.planID,
            planName: planName ?? self.planName,
            routineID: routineID ?? self.routineID,
            routineName: routineName ?? self.routineName,
            startedAt: startedAt ?? self.startedAt,
            startedOn: startedOn ?? self.startedOn,
            workoutID: workoutID ?? self.workoutID
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - WorkoutEntry
struct WorkoutEntry: Codable {
    let description: String?
    let exerciseID: String?
    let kind: Kind
    let module: ModuleKind
    let rounds: Rounds
    let sets: [LoggedSet]?
    let title: String?
    let members: [SupersetMemberSnapshot]?
    let restSeconds: Int?

    enum CodingKeys: String, CodingKey {
        case description = "description"
        case exerciseID = "exerciseId"
        case kind = "kind"
        case module = "module"
        case rounds = "rounds"
        case sets = "sets"
        case title = "title"
        case members = "members"
        case restSeconds = "restSeconds"
    }
}

// MARK: WorkoutEntry convenience initializers and mutators

extension WorkoutEntry {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(WorkoutEntry.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        description: String?? = nil,
        exerciseID: String?? = nil,
        kind: Kind? = nil,
        module: ModuleKind? = nil,
        rounds: Rounds? = nil,
        sets: [LoggedSet]?? = nil,
        title: String?? = nil,
        members: [SupersetMemberSnapshot]?? = nil,
        restSeconds: Int?? = nil
    ) -> WorkoutEntry {
        return WorkoutEntry(
            description: description ?? self.description,
            exerciseID: exerciseID ?? self.exerciseID,
            kind: kind ?? self.kind,
            module: module ?? self.module,
            rounds: rounds ?? self.rounds,
            sets: sets ?? self.sets,
            title: title ?? self.title,
            members: members ?? self.members,
            restSeconds: restSeconds ?? self.restSeconds
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - SupersetMemberSnapshot
struct SupersetMemberSnapshot: Codable {
    let actuals: [SupersetMemberActual]
    let description: String
    let exerciseID: String
    let supersetMemberSnapshotSet: SupersetMemberSet
    let title: String

    enum CodingKeys: String, CodingKey {
        case actuals = "actuals"
        case description = "description"
        case exerciseID = "exerciseId"
        case supersetMemberSnapshotSet = "set"
        case title = "title"
    }
}

// MARK: SupersetMemberSnapshot convenience initializers and mutators

extension SupersetMemberSnapshot {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(SupersetMemberSnapshot.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        actuals: [SupersetMemberActual]? = nil,
        description: String? = nil,
        exerciseID: String? = nil,
        supersetMemberSnapshotSet: SupersetMemberSet? = nil,
        title: String? = nil
    ) -> SupersetMemberSnapshot {
        return SupersetMemberSnapshot(
            actuals: actuals ?? self.actuals,
            description: description ?? self.description,
            exerciseID: exerciseID ?? self.exerciseID,
            supersetMemberSnapshotSet: supersetMemberSnapshotSet ?? self.supersetMemberSnapshotSet,
            title: title ?? self.title
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

// MARK: - SupersetMemberActual
struct SupersetMemberActual: Codable {
    let actualReps: Int?
    let actualWeightKg: Double?
    let mode: Mode
    let actualSeconds: Int?

    enum CodingKeys: String, CodingKey {
        case actualReps = "actualReps"
        case actualWeightKg = "actualWeightKg"
        case mode = "mode"
        case actualSeconds = "actualSeconds"
    }
}

// MARK: SupersetMemberActual convenience initializers and mutators

extension SupersetMemberActual {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(SupersetMemberActual.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        actualReps: Int?? = nil,
        actualWeightKg: Double?? = nil,
        mode: Mode? = nil,
        actualSeconds: Int?? = nil
    ) -> SupersetMemberActual {
        return SupersetMemberActual(
            actualReps: actualReps ?? self.actualReps,
            actualWeightKg: actualWeightKg ?? self.actualWeightKg,
            mode: mode ?? self.mode,
            actualSeconds: actualSeconds ?? self.actualSeconds
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

enum Rounds: Codable {
    case double(Double)
    case integer(Int)

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let x = try? container.decode(Int.self) {
            self = .integer(x)
            return
        }
        if let x = try? container.decode(Double.self) {
            self = .double(x)
            return
        }
        throw DecodingError.typeMismatch(Rounds.self, DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Wrong type for Rounds"))
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .double(let x):
            try container.encode(x)
        case .integer(let x):
            try container.encode(x)
        }
    }
}

// MARK: - LoggedSet
struct LoggedSet: Codable {
    let actualReps: Int?
    let actualWeightKg: Double?
    let mode: Mode
    let restSeconds: Int?
    let targetReps: Int?
    let weightKg: Double?
    let actualSeconds: Int?
    let targetSeconds: Int?

    enum CodingKeys: String, CodingKey {
        case actualReps = "actualReps"
        case actualWeightKg = "actualWeightKg"
        case mode = "mode"
        case restSeconds = "restSeconds"
        case targetReps = "targetReps"
        case weightKg = "weightKg"
        case actualSeconds = "actualSeconds"
        case targetSeconds = "targetSeconds"
    }
}

// MARK: LoggedSet convenience initializers and mutators

extension LoggedSet {
    init(data: Data) throws {
        self = try newJSONDecoder().decode(LoggedSet.self, from: data)
    }

    init(_ json: String, using encoding: String.Encoding = .utf8) throws {
        guard let data = json.data(using: encoding) else {
            throw NSError(domain: "JSONDecoding", code: 0, userInfo: nil)
        }
        try self.init(data: data)
    }

    init(fromURL url: URL) throws {
        try self.init(data: try Data(contentsOf: url))
    }

    func with(
        actualReps: Int?? = nil,
        actualWeightKg: Double?? = nil,
        mode: Mode? = nil,
        restSeconds: Int?? = nil,
        targetReps: Int?? = nil,
        weightKg: Double?? = nil,
        actualSeconds: Int?? = nil,
        targetSeconds: Int?? = nil
    ) -> LoggedSet {
        return LoggedSet(
            actualReps: actualReps ?? self.actualReps,
            actualWeightKg: actualWeightKg ?? self.actualWeightKg,
            mode: mode ?? self.mode,
            restSeconds: restSeconds ?? self.restSeconds,
            targetReps: targetReps ?? self.targetReps,
            weightKg: weightKg ?? self.weightKg,
            actualSeconds: actualSeconds ?? self.actualSeconds,
            targetSeconds: targetSeconds ?? self.targetSeconds
        )
    }

    func jsonData() throws -> Data {
        return try newJSONEncoder().encode(self)
    }

    func jsonString(encoding: String.Encoding = .utf8) throws -> String? {
        return String(data: try self.jsonData(), encoding: encoding)
    }
}

enum StartedOn: String, Codable {
    case phone = "phone"
    case watch = "watch"
}

// MARK: - Helper functions for creating encoders and decoders

func newJSONDecoder() -> JSONDecoder {
    let decoder = JSONDecoder()
    if #available(iOS 10.0, OSX 10.12, tvOS 10.0, watchOS 3.0, *) {
        decoder.dateDecodingStrategy = .iso8601
    }
    return decoder
}

func newJSONEncoder() -> JSONEncoder {
    let encoder = JSONEncoder()
    if #available(iOS 10.0, OSX 10.12, tvOS 10.0, watchOS 3.0, *) {
        encoder.dateEncodingStrategy = .iso8601
    }
    return encoder
}

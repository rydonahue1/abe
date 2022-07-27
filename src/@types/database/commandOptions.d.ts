
export interface CommandOptionsRecord {
  equipments: Choice[]
  muscleGroups: Choice[]
  primaryMuscles: Choice[]
}

export interface Choice {
  name: string
  value: string
}

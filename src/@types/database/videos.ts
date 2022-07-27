import { Snippet } from "../youtube"

export interface VideoRecord extends Snippet {
  videoId: string
  modification: string
  videoUrl: string
  muscleGroups: string[]
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string[]
  musclesEquipment: string[]
}
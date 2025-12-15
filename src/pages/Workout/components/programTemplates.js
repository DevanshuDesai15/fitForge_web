export const programTemplates = [
  {
    id: "push-pull-legs",
    name: "Push Pull Legs",
    description:
      "Classic 3-day split focusing on push movements, pull movements, and legs",
    category: "Strength Training",
    difficulty: "Intermediate",
    frequency: "3x/week",
    duration: "6 weeks",
    days: [
      {
        id: 1,
        name: "Push Day",
        focus: "Chest, Shoulders, Triceps",
        exercises: [],
      },
      { id: 2, name: "Pull Day", focus: "Back, Biceps", exercises: [] },
      {
        id: 3,
        name: "Legs Day",
        focus: "Quads, Hamstrings, Glutes",
        exercises: [],
      },
    ],
  },
  {
    id: "upper-lower",
    name: "Upper Lower Split",
    description: "4-day alternating upper and lower body workouts",
    category: "Hypertrophy",
    difficulty: "Intermediate",
    frequency: "4x/week",
    duration: "8 weeks",
    days: [
      {
        id: 1,
        name: "Upper Body A",
        focus: "Chest, Back, Shoulders",
        exercises: [],
      },
      {
        id: 2,
        name: "Lower Body A",
        focus: "Quads, Hamstrings",
        exercises: [],
      },
      {
        id: 3,
        name: "Upper Body B",
        focus: "Chest, Back, Arms",
        exercises: [],
      },
      {
        id: 4,
        name: "Lower Body B",
        focus: "Quads, Hamstrings, Glutes",
        exercises: [],
      },
    ],
  },
];

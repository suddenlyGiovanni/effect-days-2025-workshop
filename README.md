# Effect Days 2025 Workshop

Welcome to the official repository for the **Effect Days 2025 Workshop**! This workshop is designed to guide you through interactive, hands-on exercises using Effect-TS.

## Introduction

This repository contains all the resources you need for the **Effect Days 2025 Workshop**. You will work through a series of practical exercises, view demos, and engage with peers to enhance your skills with Effect-TS.

## Workshop Schedule

| Speaker |           | Time Slot           | Duration   |
| :------ | :-------- | :------------------ | :--------- |
| Max     | Session 1 | 9:00 AM – 10:30 AM  | 1.5 hours  |
|         | Break     | 10:30 AM – 10:45 AM | 15 minutes |
|         | Session 2 | 10:45 AM – 12:15 PM | 1.5 hours  |
|         | Lunch     | 12:15 PM – 1:15 PM  | 1 hour     |
| Tim     | Session 3 | 1:15 PM – 2:45 PM   | 1.5 hours  |
|         | Break     | 2:45 PM – 3:00 PM   | 15 minutes |
|         | Session 4 | 3:00 PM – 4:30 PM   | 1.5 hours  |
|         | Q & A     | 4:30 PM – 5:00 PM   | 30 minutes |

## Repository Structure

- **[exercises](./src/exercises):** This folder contains all the exercises you are expected to complete.
- **[demos](./src/demos):** Code that we will explore together during the workshop. *Do not edit these files.*
- **[examples](./src/examples):** Code used in the slides. *Do not edit these files.*

## Requirements & Setup

Before you begin, please ensure you have the following installed on your machine:

- **Node.js**
- A package manager (we recommend using `pnpm`)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Effect-TS/effect-days-2025-workshop.git
   ```
2. **Install dependencies:**
   ```bash
   pnpm install
   ```
3. **Explore the Code:**
   Feel free to open and explore any of the files in [`src/exercises`](./src/exercises), [`src/demos`](./src/demos), or [`src/examples`](./src/examples). Familiarizing yourself with the structure will help you navigate during the workshop. **We'll go through the exercises together as a group**.

### Executing TypeScript Files with TSX

You can run the `.ts` files directly using [tsx](https://github.com/esbuild-kit/tsx):

Install `tsx` globally
```bash
npm install -g tsx
# or
pnpm add -g tsx
```
Or use via `npx`/`pnpx`:
```bash
npx tsx path/to/your/exercise.ts
# or
pnpx tsx path/to/your/exercise.ts
```

## How to Complete the Exercises

The exercises are divided into two main sections: `section-1` and `section-2`. Exercises should be completed in order, as we will go through them together as a group. Each exercise file follows this naming convention:

```
<exercise-number>_<exercise-name>.ts
```

For example, start with `001_exercise.ts`, then move on to `002_exercise.ts`, and so on.

## Shared Code & Solutions

- **Shared Code:** To help you get started quickly, each session includes a `shared` folder with common code snippets.
- **Solutions:** Each exercise has an accompanying solution file (indicated by the `-solution.ts` suffix). Keep in mind that multiple approaches can solve a problem, comparing your work with the provided solutions is an excellent learning opportunity.

## Getting Help

If you encounter any issues or have questions during the workshop, please don't hesitate to ask. Our team members will be available to assist you throughout the event.

## Additional Resources

- [Effect website](https://effect.website)
- [API Reference](https://effect-ts.github.io/effect/docs/effect)

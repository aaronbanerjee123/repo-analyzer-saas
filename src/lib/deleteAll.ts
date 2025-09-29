// scripts/deleteAllProjects.ts
import { db } from "~/server/db";

export async function deleteAll() {
  // Delete in order due to foreign key constraints
  await db.sourceCodeEmbedding.deleteMany({}); // Delete this first!

  await db.commit.deleteMany({});
  await db.userToProject.deleteMany({});
  await db.project.deleteMany({});

  console.log("All projects and related data deleted!");
}

await deleteAll();

import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "~/lib/github";
import { indexGithubRepo } from "~/lib/github-loader";

export const projectRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        githubUrl: z.string(),
        githubToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log(ctx.userId);
      const project = await ctx.db.project.create({
        data: {
          githubUrl: input.githubUrl,
          name: input.name,
          userToProjects: {
            create: {
              userId: ctx.userId!,
            },
          },
        },
      });
      indexGithubRepo(project.id, input.githubUrl, input.githubToken)
        .then(() => console.log("Indexing complete"))
        .catch(console.error);

      await pollCommits(project.id);
      return project;
    }),
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      where: {
        userToProjects: { some: { userId: ctx.userId } },
        deletedAt: null,
      },
    });
  }),
  getCommits: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      pollCommits(input.projectId).then().catch(console.error);
      return await ctx.db.commit.findMany({
        where: {
          projectId: input.projectId,
        },
      });
    }),

  saveAnswer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        question: z.string(),
        fileReferences: z.any(),
        answer: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.question.create({
        data: {
          answer: input.answer,
          fileReferences: input.fileReferences,
          projectId: input.projectId,
          question: input.question,
          userId: ctx.userId!,
        },
      });
    }),

  getQuestions: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    ).query(async ({ ctx, input }) => {
      return await ctx.db.question.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

    uploadMeeting:protectedProcedure.input(z.object({projectId:z.string(), meetingUrl:z.string(), name:z.string()}))
    .mutation(async ({ctx,input}) => {
      const meeting = await ctx.db.meeting.create({
        data:{
          meetingUrl:input.meetingUrl,
          projectId:input.projectId,
          name:input.name,
          status:"PROCESSING"
        }
      })
      return meeting
    }),
    getMeetings: protectedProcedure.input(z.object({projectId:z.string()})).query(async ({ctx,input}) => {
      return await ctx.db.meeting.findMany({where: {projectId:input.projectId}, include:{issues:true}})
    }),
    getMeetingById: protectedProcedure.input(z.object({meetingId:z.string()})).query(async({ctx,input}) => {
      return await ctx.db.meeting.findUnique({where:{id:input.meetingId}, include:{issues:true}})
    } )
});

import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

import {
  action,
  internalMutation,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import { api, internal } from "./_generated/api";
import { OpenAI } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ParsedChatCompletion } from "openai/resources/beta/chat/completions.mjs";
import { Doc, Id } from "./_generated/dataModel";
import { ChatCompletion } from "openai/resources/index.mjs";
import { RegisteredAction, RegisteredQuery } from "convex/server";

const openai = new OpenAI();

async function authenticate(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new ConvexError("Not signed in");
  }

  const user = await ctx.db.get(userId);

  if (!user) {
    throw new ConvexError("User not found");
  }

  return {
    userId,
    familyId: user.familyId,
  };
}

async function authenticateWithFamily(ctx: QueryCtx) {
  const { userId, familyId } = await authenticate(ctx);

  if (!familyId) {
    throw new ConvexError("Not in a family");
  }

  return { userId, familyId };
}

async function setStaleSummary(ctx: MutationCtx, familyId: Id<"families">) {
  const summary = await ctx.db
    .query("summaries")
    .withIndex("by_family", (q) => q.eq("familyId", familyId))
    .unique();

  if (summary) {
    await ctx.db.patch(summary._id, {
      isStale: true,
    });
  }
}

export const all = query({
  args: {},
  handler: async (ctx) => {
    const { familyId } = await authenticate(ctx);

    if (!familyId) {
      return [];
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .collect();

    return tasks;
  },
});

const NoteAssignment = z.object({
  notes: z.array(z.object({ description: z.string() })),
  list: z.object({ name: z.string(), description: z.string() }),
});

export const add = action({
  args: { description: v.string() },
  handler: async (ctx, { description }) => {
    const taskLists = await ctx.runQuery(api.tasks.lists, {});
    const completion: ParsedChatCompletion<z.infer<typeof NoteAssignment>> =
      await openai.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "system",
            content: `You will receive a note in Norwegian. Follow these instructions:
              
- Identify which list such a note should be added to
- When creating a new list, avoid too generic names that will capture many notes
- When choosing an existing list, make sure the note fits the list's purpose
- Identify if the note should be split up into multiple actionable notes
- All note descriptions and list names should be in Norwegian`,
          },
          {
            role: "user",
            content: `This is the description of the note:
          
${description}

And the following lists are available:

${taskLists.map((list) => `- ${list.name} : ${list.description}`).join("\n")}
`,
          },
        ],
        response_format: zodResponseFormat(NoteAssignment, "noteAssigment"),
      });

    const result = completion.choices[0].message.parsed;

    if (!result) {
      throw new ConvexError("No result");
    }

    const list = taskLists.find((list) => list.name === result.list.name);
    let listId: Id<"taskLists">;

    if (list) {
      listId = list._id;
    } else {
      listId = await ctx.runMutation(internal.tasks.addTaskList, {
        name: result.list.name,
        description: result.list.description,
      });
    }

    await Promise.all(
      result.notes.map((note) =>
        ctx.runMutation(internal.tasks.addTask, {
          description: note.description,
          listId: listId,
        }),
      ),
    );
  },
});

export const addTaskList = internalMutation({
  args: { name: v.string(), description: v.string() },
  handler: async (ctx, { name, description }) => {
    const { familyId } = await authenticateWithFamily(ctx);

    return ctx.db.insert("taskLists", {
      name,
      description,
      familyId,
    });
  },
});

export const addTask = internalMutation({
  args: { description: v.string(), listId: v.id("taskLists") },
  handler: async (ctx, { description, listId }) => {
    const { familyId, userId } = await authenticateWithFamily(ctx);

    if (!familyId) {
      throw new ConvexError("Not in a family");
    }

    await ctx.db.insert("tasks", {
      description,
      familyId,
      userId,
      listId,
      isCompleted: false,
    });

    await setStaleSummary(ctx, familyId);
  },
});

export const lists: RegisteredQuery<
  "public",
  Record<string, never>,
  Promise<Doc<"taskLists">[]>
> = query({
  handler: async (ctx) => {
    const { familyId } = await authenticate(ctx);

    if (!familyId) {
      return [];
    }

    const lists = await ctx.db
      .query("taskLists")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .collect();

    return lists;
  },
});

export const toggleCompleted = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    const { familyId } = await authenticateWithFamily(ctx);

    if (!familyId) {
      throw new ConvexError("Not in a family");
    }

    const task = await ctx.db.get(taskId);

    if (!task || task.familyId !== familyId) {
      throw new ConvexError("Task not found");
    }

    await ctx.db.patch(taskId, {
      isCompleted: !task.isCompleted,
    });

    await setStaleSummary(ctx, familyId);
  },
});

export const clearCompleted = mutation({
  args: { listId: v.id("taskLists") },
  handler: async (ctx, { listId }) => {
    const { familyId } = await authenticateWithFamily(ctx);

    const list = await ctx.db.get(listId);

    if (list?.familyId !== familyId) {
      throw new ConvexError("List not found");
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();

    await Promise.all(
      tasks
        .filter((task) => task.isCompleted)
        .map((task) => ctx.db.delete(task._id)),
    );

    await setStaleSummary(ctx, familyId);
  },
});

export const deleteList = mutation({
  args: { listId: v.id("taskLists") },
  handler: async (ctx, { listId }) => {
    const { familyId } = await authenticateWithFamily(ctx);

    const list = await ctx.db.get(listId);

    if (list?.familyId !== familyId) {
      throw new ConvexError("List not found");
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();

    const isAllCompleted = tasks.every((task) => task.isCompleted);

    if (!isAllCompleted) {
      throw new ConvexError("Not all tasks are completed");
    }

    await ctx.runMutation(api.tasks.clearCompleted, { listId });

    await ctx.db.delete(listId);

    await setStaleSummary(ctx, familyId);
  },
});

export const summary: RegisteredQuery<
  "public",
  Record<string, never>,
  Promise<Doc<"summaries"> | null>
> = query({
  handler: async (ctx) => {
    const { familyId } = await authenticate(ctx);

    if (!familyId) {
      return null;
    }

    const summary = await ctx.db
      .query("summaries")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .unique();

    return summary;
  },
});

export const createSummary: RegisteredAction<
  "public",
  Record<string, never>,
  Promise<void>
> = action({
  handler: async (ctx) => {
    const [summary, tasks] = await Promise.all([
      ctx.runQuery(api.tasks.summary),
      ctx.runQuery(api.tasks.all),
    ]);

    const completion: ChatCompletion = await openai.chat.completions.create({
      model: "chatgpt-4o-latest",
      messages: [
        {
          role: "system",
          content: `You are a Norwegian family assistant. You will get a list of notes and should create a brief summary of the notes, but highlighting notes that is considered an event. The summary should be in Norwegian and you should respond without a title to the summary.`,
        },
        {
          role: "user",
          content: `This is the list of notes:
          
${tasks.map((task) => `- ${task.description}`).join("\n")}
`,
        },
      ],
    });

    const result = completion.choices[0].message.content;

    if (!result) {
      throw new ConvexError("No summary result");
    }

    await ctx.runMutation(internal.tasks.insertSummary, {
      summary: result,
      summaryId: summary?._id,
    });
  },
});

export const insertSummary = internalMutation({
  args: { summary: v.string(), summaryId: v.optional(v.id("summaries")) },
  handler: async (ctx, { summary, summaryId }) => {
    const { familyId } = await authenticateWithFamily(ctx);

    if (summaryId) {
      await ctx.db.patch(summaryId, {
        summary,
        isStale: false,
      });
    } else {
      await ctx.db.insert("summaries", {
        familyId,
        isStale: false,
        summary,
      });
    }
  },
});

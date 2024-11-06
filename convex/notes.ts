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
import { getAuthUserId } from "@convex-dev/auth/server";

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

const openai = new OpenAI();

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

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .collect();

    return notes;
  },
});

const NoteAssignment = z.object({
  notes: z.array(z.object({ description: z.string() })),
  list: z.object({ name: z.string(), description: z.string() }),
  existingListNameToRename: z.optional(z.string()),
});

export const add = action({
  args: { description: v.string() },
  handler: async (ctx, { description }) => {
    const [noteLists, family] = await Promise.all([
      ctx.runQuery(api.notes.lists, {}),
      ctx.runQuery(api.users.family),
    ]);
    const completion: ParsedChatCompletion<z.infer<typeof NoteAssignment>> =
      await openai.beta.chat.completions.parse({
        model: "gpt-4o-2024-08-06",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `You will receive a note in ${family.language}. Follow these instructions:
              
- Identify which list such a note should be added to
- If there is an existing related list, rename that list 
- When creating a new list, avoid too generic names that will capture many notes
- When choosing an existing list, make sure the note fits the list's purpose
- Identify if the note should be split up into multiple actionable notes
- All note descriptions and list names should be in ${family.language}`,
          },
          {
            role: "user",
            content: `This is the description of the note:
          
${description}

And the following lists are available:

${noteLists.map((list) => `- ${list.name} : ${list.description}`).join("\n")}
`,
          },
        ],
        response_format: zodResponseFormat(NoteAssignment, "noteAssigment"),
      });

    const result = completion.choices[0].message.parsed;

    if (!result) {
      throw new ConvexError("No result");
    }

    const list = noteLists.find((list) => list.name === result.list.name);
    const listToRename = noteLists.find(
      (list) => list.name === result.existingListNameToRename,
    );
    let listId: Id<"noteLists">;

    if (listToRename) {
      await ctx.runMutation(internal.notes.updateNoteList, {
        listId: listToRename._id,
        name: result.list.name,
        description: result.list.description,
      });
      listId = listToRename._id;
    } else if (list) {
      listId = list._id;
    } else {
      listId = await ctx.runMutation(internal.notes.addNoteList, {
        name: result.list.name,
        description: result.list.description,
      });
    }

    await Promise.all(
      result.notes.map((note) =>
        ctx.runMutation(internal.notes.addNote, {
          description: note.description,
          listId: listId,
        }),
      ),
    );
  },
});

export const addNoteList = internalMutation({
  args: { name: v.string(), description: v.string() },
  handler: async (ctx, { name, description }) => {
    const { familyId } = await authenticateWithFamily(ctx);

    return ctx.db.insert("noteLists", {
      name,
      description,
      familyId,
    });
  },
});

export const addNote = internalMutation({
  args: { description: v.string(), listId: v.id("noteLists") },
  handler: async (ctx, { description, listId }) => {
    const { familyId, userId } = await authenticateWithFamily(ctx);

    if (!familyId) {
      throw new ConvexError("Not in a family");
    }

    await ctx.db.insert("notes", {
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
  Promise<Doc<"noteLists">[]>
> = query({
  handler: async (ctx) => {
    const { familyId } = await authenticate(ctx);

    if (!familyId) {
      return [];
    }

    const lists = await ctx.db
      .query("noteLists")
      .withIndex("by_family", (q) => q.eq("familyId", familyId))
      .collect();

    return lists;
  },
});

export const toggleCompleted = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const { familyId } = await authenticateWithFamily(ctx);

    if (!familyId) {
      throw new ConvexError("Not in a family");
    }

    const note = await ctx.db.get(noteId);

    if (!note || note.familyId !== familyId) {
      throw new ConvexError("Note not found");
    }

    await ctx.db.patch(noteId, {
      isCompleted: !note.isCompleted,
    });

    await setStaleSummary(ctx, familyId);
  },
});

export const clearCompleted = mutation({
  args: { listId: v.id("noteLists") },
  handler: async (ctx, { listId }) => {
    const { familyId } = await authenticateWithFamily(ctx);

    const list = await ctx.db.get(listId);

    if (list?.familyId !== familyId) {
      throw new ConvexError("List not found");
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();

    await Promise.all(
      notes
        .filter((note) => note.isCompleted)
        .map((note) => ctx.db.delete(note._id)),
    );

    await setStaleSummary(ctx, familyId);
  },
});

export const deleteList = mutation({
  args: { listId: v.id("noteLists") },
  handler: async (ctx, { listId }) => {
    const { familyId } = await authenticateWithFamily(ctx);

    const list = await ctx.db.get(listId);

    if (list?.familyId !== familyId) {
      throw new ConvexError("List not found");
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_list", (q) => q.eq("listId", listId))
      .collect();

    const isAllCompleted = notes.every((note) => note.isCompleted);

    if (!isAllCompleted) {
      throw new ConvexError("Not all notes are completed");
    }

    await ctx.runMutation(api.notes.clearCompleted, { listId });

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
    const [summary, notes, family] = await Promise.all([
      ctx.runQuery(api.notes.summary),
      ctx.runQuery(api.notes.all),
      ctx.runQuery(api.users.family),
    ]);

    const completion: ChatCompletion = await openai.chat.completions.create({
      model: "chatgpt-4o-latest",
      messages: [
        {
          role: "system",
          content: `You are a ${family} family assistant. Please follow these instructions:
        
  - You will get a list of notes that has been added by family members and you should give a brief summary of them
  - Highlight notes that is considered an event
  - The summary should be in ${family.language} and you should respond without a title to the summary
  - End the response by writing some encouraging words to the family`,
        },
        {
          role: "user",
          content: `This is our family, written in ${family.language}:
  ${family.description}          
        
  Todays date is ${new Date().toLocaleDateString("en-US", { weekday: "long" })} ${new Date().toISOString().split("T")[0]} and this is the list of notes:
        
  ${notes.map((note) => `${note.description}${note.isCompleted ? " (COMPLETED)" : ""}`).join("\n")}
  `,
        },
      ],
    });

    const result = completion.choices[0].message.content;

    if (!result) {
      throw new ConvexError("No summary result");
    }

    await ctx.runMutation(internal.notes.insertSummary, {
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
        date: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
      });
    }
  },
});

export const updateNoteList = internalMutation({
  args: {
    listId: v.id("noteLists"),
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, { listId, name, description }) => {
    const { familyId } = await authenticateWithFamily(ctx);

    const list = await ctx.db.get(listId);

    if (list?.familyId !== familyId) {
      throw new ConvexError("List not found");
    }

    await ctx.db.patch(listId, {
      name,
      description,
    });
  },
});

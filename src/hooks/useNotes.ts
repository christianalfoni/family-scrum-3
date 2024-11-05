import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

export type Note = Doc<"notes">;
export type List = Doc<"noteLists"> & { notes: Note[] };

export function useNotes() {
  const notes = useQuery(api.notes.all) || [];
  const noteLists = useQuery(api.notes.lists) || [];

  const notesByListId = notes.reduce<Record<string, Doc<"notes">[]>>(
    (aggr, note) => {
      const assigned = aggr[note.listId] || [];

      assigned.push(note);

      aggr[note.listId] = assigned;

      return aggr;
    },
    {},
  );

  return noteLists.map(
    (noteList): List => ({
      ...noteList,
      notes: notesByListId[noteList._id] || [],
    }),
  );
}

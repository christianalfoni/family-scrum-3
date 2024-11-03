import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

export type Task = Doc<"tasks">;
export type List = Doc<"taskLists"> & { tasks: Task[] };

export function useTasks() {
  const tasks = useQuery(api.tasks.all) || [];
  const taskLists = useQuery(api.tasks.lists) || [];

  const tasksByListId = tasks.reduce<Record<string, Doc<"tasks">[]>>(
    (aggr, task) => {
      const assigned = aggr[task.listId] || [];

      assigned.push(task);

      aggr[task.listId] = assigned;

      return aggr;
    },
    {},
  );

  return taskLists.map(
    (taskList): List => ({
      ...taskList,
      tasks: tasksByListId[taskList._id] || [],
    }),
  );
}

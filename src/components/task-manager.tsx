import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Markdown from "markdown-to-jsx";
import {
  Loader2,
  Plus,
  Trash2,
  Check,
  CheckSquare,
  ListCheck,
  Wand2,
} from "lucide-react";
import { List, useTasks } from "@/hooks/useTasks";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type TaskMutation =
  | {
      isUpdating: true;
      error: null;
    }
  | {
      isUpdating: false;
      error: null;
    }
  | {
      isUpdating: false;
      error: string;
    };

export function TaskManagerComponent() {
  const lists = useTasks();
  const summary = useQuery(api.tasks.summary);
  const [newTask, setNewTask] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [mutatingTasks, setMutatingTasks] = useState<
    Record<Id<"tasks">, TaskMutation>
  >({});
  const addTaskAction = useAction(api.tasks.add);
  const toggleCompletedMutation = useMutation(api.tasks.toggleCompleted);
  const clearCompletedTasksMutation = useMutation(api.tasks.clearCompleted);
  const deleteListMutation = useMutation(api.tasks.deleteList);
  const createSummaryAction = useAction(api.tasks.createSummary);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const addTask = async () => {
    if (newTask.trim() === "") return;

    try {
      setIsAdding(true);
      const test = await addTaskAction({ description: newTask });
      console.log(test);
    } finally {
      setNewTask("");
      setIsAdding(false);
    }
  };

  const toggleTaskCompletion = async (taskId: Id<"tasks">) => {
    try {
      setMutatingTasks((prev) => ({
        ...prev,
        [taskId]: { isUpdating: true, error: null },
      }));
      await toggleCompletedMutation({ taskId });
      setMutatingTasks((prev) => ({
        ...prev,
        [taskId]: { isUpdating: false, error: null },
      }));
    } catch (error) {
      setMutatingTasks((prev) => ({
        ...prev,
        [taskId]: { isUpdating: false, error: String(error) },
      }));
    }
  };

  const clearCompletedTasks = async (listId: Id<"taskLists">) => {
    try {
      await clearCompletedTasksMutation({ listId });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteList = async (listId: Id<"taskLists">) => {
    const currentSelectedListId = selectedListId!;

    try {
      setSelectedListId(null);
      await deleteListMutation({ listId });
    } catch (error) {
      setSelectedListId(currentSelectedListId);
      console.error(error);
    }
  };

  const generateSummary = async () => {
    try {
      await createSummaryAction();
    } catch (error) {
      console.error(error);
    }
  };

  const selectedList = lists.find((list) => list._id === selectedListId);

  const isListCompleted = (list: List) =>
    list.tasks.length > 0 && list.tasks.every((task) => task.isCompleted);

  return (
    <div className="container mx-auto p-4 flex flex-col h-screen max-w-5xl">
      <div className="mb-4 flex items-center space-x-2">
        <div className="flex-grow">
          <Input
            placeholder="Enter new note..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="text-lg p-6"
          />
        </div>
        <Button
          onClick={() => {
            void addTask();
          }}
          disabled={newTask.trim() === "" || isAdding}
          size="icon"
          aria-label="Add task"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="mb-4 flex justify-center flex-wrap gap-2">
        {lists.map((list) => {
          const isCompleted = isListCompleted(list);

          return (
            <Badge
              key={list._id}
              variant={selectedListId === list._id ? "default" : "secondary"}
              className={`cursor-pointer text-sm py-1 px-2 transition-opacity duration-300 ${
                isCompleted ? "bg-green-600" : ""
              }`}
              onClick={() =>
                setSelectedListId((current) =>
                  current === list._id ? null : list._id,
                )
              }
            >
              {list.name}{" "}
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                "(" +
                list.tasks.filter((task) => !task.isCompleted).length +
                ")"
              )}
            </Badge>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        {!selectedList && summary && !summary.isStale ? (
          <Markdown>{summary.summary}</Markdown>
        ) : null}
        {!selectedList && (!summary || summary?.isStale) ? (
          <div className="flex items-center justify-center h-full">
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                void generateSummary();
              }}
            >
              <Wand2 className="h-6 w-6" />
            </Button>
          </div>
        ) : null}
        {selectedList && (
          <>
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="px-4 mb-4 flex justify-end">
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void clearCompletedTasks(selectedList._id);
                    }}
                    disabled={
                      !selectedList.tasks.some((task) => task.isCompleted)
                    }
                  >
                    <CheckSquare className="h-4 w-4" />
                    {"=>"}
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      void deleteList(selectedList._id);
                    }}
                    disabled={!isListCompleted(selectedList)}
                  >
                    <ListCheck className="h-4 w-4" />
                    {"=>"}
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedList.tasks.map((task) => (
                <div
                  key={task._id}
                  className={`flex items-center space-x-2 mb-2 px-4 ${mutatingTasks[task._id]?.isUpdating ? "opacity-50" : ""} ${mutatingTasks[task._id]?.error ? "text-red-600" : ""}`}
                >
                  <Checkbox
                    id={`task-${task._id}`}
                    checked={task.isCompleted}
                    onCheckedChange={() => void toggleTaskCompletion(task._id)}
                  />
                  <label
                    htmlFor={`task-${task._id}`}
                    className={`flex-1 ${task.isCompleted ? "line-through text-gray-500" : ""}`}
                  >
                    {task.description}
                  </label>
                </div>
              ))}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}

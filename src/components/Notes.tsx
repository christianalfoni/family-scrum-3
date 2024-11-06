import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Markdown from "markdown-to-jsx";
import {
  ListChecksIcon,
  Trash2,
  Check,
  CheckSquare,
  ListCheck,
  Wand2,
} from "lucide-react";
import { List, useNotes } from "@/hooks/useNotes";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SparkleButton } from "./sparkle-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

type NoteMutation =
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

export function Notes() {
  const lists = useNotes();
  const summary = useQuery(api.notes.summary);
  const [newNote, setNewNote] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [mutatingNotes, setMutatingNotes] = useState<
    Record<Id<"notes">, NoteMutation>
  >({});
  const addNoteAction = useAction(api.notes.add);
  const toggleCompletedMutation = useMutation(api.notes.toggleCompleted);
  const clearCompletedMutation = useMutation(api.notes.clearCompleted);
  const deleteListMutation = useMutation(api.notes.deleteList);
  const createSummaryAction = useAction(api.notes.createSummary);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const addNote = async () => {
    if (newNote.trim() === "") return;

    try {
      setIsAdding(true);
      const test = await addNoteAction({ description: newNote });
      console.log(test);
    } finally {
      setNewNote("");
      setIsAdding(false);
    }
  };

  const toggleCompletion = async (noteId: Id<"notes">) => {
    try {
      setMutatingNotes((prev) => ({
        ...prev,
        [noteId]: { isUpdating: true, error: null },
      }));
      await toggleCompletedMutation({ noteId });
      setMutatingNotes((prev) => ({
        ...prev,
        [noteId]: { isUpdating: false, error: null },
      }));
    } catch (error) {
      setMutatingNotes((prev) => ({
        ...prev,
        [noteId]: { isUpdating: false, error: String(error) },
      }));
    }
  };

  const clearCompleted = async (listId: Id<"noteLists">) => {
    try {
      await clearCompletedMutation({ listId });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteList = async (listId: Id<"noteLists">) => {
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
      setIsGeneratingSummary(true);
      await createSummaryAction();
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const selectedList = lists.find((list) => list._id === selectedListId);

  const isListCompleted = (list: List) =>
    list.notes.length > 0 && list.notes.every((note) => note.isCompleted);

  return (
    <div className="container mx-auto p-4 flex flex-col h-screen max-w-5xl">
      <div className="mb-4 flex items-center space-x-2 relative">
        <div className="flex-grow relative">
          <Textarea
            placeholder="Enter new note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="text-lg p-4"
          />
          <div className="absolute bottom-2 right-2">
            <SparkleButton
              icon={<ListChecksIcon className="h-4 w-4 mr-2" />}
              onClick={() => {
                void addNote();
              }}
              disabled={newNote.trim() === ""}
              loading={isAdding}
            >
              Add
            </SparkleButton>
          </div>
        </div>
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
                list.notes.filter((note) => !note.isCompleted).length +
                ")"
              )}
            </Badge>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        {!selectedList && summary && !summary.isStale ? (
          <div
            className="mx-auto text-xl leading-relaxed markdown"
            style={{ maxWidth: "500px" }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Summary
                </CardTitle>
                <CardDescription>
                  {new Date(summary.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Markdown options={{ forceBlock: true }}>
                  {summary.summary}
                </Markdown>
              </CardContent>
            </Card>
          </div>
        ) : null}
        {!selectedList &&
        lists.length &&
        (summary === null || (summary && summary.isStale)) ? (
          <div className="flex items-center justify-center h-full">
            <SparkleButton
              icon={<Wand2 className="w-6 h-6 mr-2" />}
              loading={isGeneratingSummary}
              onClick={() => {
                void generateSummary();
              }}
            >
              Create summary
            </SparkleButton>
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
                      void clearCompleted(selectedList._id);
                    }}
                    disabled={
                      !selectedList.notes.some((note) => note.isCompleted)
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

              {selectedList.notes.map((note) => (
                <div
                  key={note._id}
                  className={`flex items-center space-x-2 mb-2 px-4 ${mutatingNotes[note._id]?.isUpdating ? "opacity-50" : ""} ${mutatingNotes[note._id]?.error ? "text-red-600" : ""}`}
                >
                  <Checkbox
                    id={`note-${note._id}`}
                    checked={note.isCompleted}
                    onCheckedChange={() => void toggleCompletion(note._id)}
                  />
                  <label
                    htmlFor={`note-${note._id}`}
                    className={`flex-1 ${note.isCompleted ? "line-through text-gray-500" : ""}`}
                  >
                    {note.description}
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

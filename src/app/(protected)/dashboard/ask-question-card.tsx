import React from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import useProject from "~/hooks/use-project";
import { Github } from "lucide-react";
import { askQuestion } from "./actions";
import { readStreamableValue } from "@ai-sdk/rsc";
import CodeReferences from "./code-references";
import { api } from "~/trpc/react";
import { toast } from "sonner";

const AskQuestionCard = () => {
  const { project } = useProject();
  const [question, setQuestion] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fileReferences, setFileReferences] = React.useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [answer, setAnswer] = React.useState("");
  const saveAnswer = api.project.saveAnswer.useMutation()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAnswer("");
    setFileReferences([]);
    setLoading(true);
    if (!project?.id) return;

    const { output, fileReferences: fileRefs } = await askQuestion(
      question,
      project.id,
    );
    setOpen(true);
    setFileReferences(fileRefs);

    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setAnswer((ans) => ans + delta);
      }
    }

    setLoading(false);
  };

  const refetch = useRefetch()

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-[90vw] flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant={"outline"} onClick={() => {
                saveAnswer.mutate({
                  projectId:project.id!,
                  question,
                  answer,
                  fileReferences
                },
              {
                onSuccess: () => {
                  toast.success('Answer saved!')
                  refetch()
                },
                onError:() => {
                  toast.error('Answer not saved')
                }



              })
              }}>Save Answer</Button>
              <div className="flex items-center gap-2">
                <Github className="size-5" />
                <DialogTitle>GitAI Answer</DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <MDEditor.Markdown source={answer} />
            </div>

            {fileReferences && fileReferences.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Code References</h3>
                <CodeReferences fileReferences={fileReferences} />
              </div>
            )}
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button type="button" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="h-[250px] w-full">
        <CardHeader>
          <CardTitle>Ask a Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="which file should I edit to change the home page?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="h-4"></div>
            <Button type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Ask GitAI!"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;

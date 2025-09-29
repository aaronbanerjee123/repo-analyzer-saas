import React from "react";
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

const AskQuestionCard = () => {
  const { project } = useProject();
  const [question, setQuestion] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fileReferences, setFileReferences] =
    React.useState<
      { fileName: string; sourceCode: string; summary: string }[]
    >();
  const [answer, setAnswer] = React.useState("");
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!project?.id) return; 
    setOpen(true);
    const { output, fileReferences:fileRefs } = await askQuestion(question, project.id);
    setFileReferences(fileRefs);

    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setAnswer((ans) => ans + delta);
      }
    }

    setLoading(false);
  };
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <DialogContent>
          <DialogHeader className="flex">
            <Github className="size-5 text-black" />
            <DialogTitle>Ask a question</DialogTitle>
          </DialogHeader>
          {answer}
          <h1>File references</h1>
            {fileReferences?.map(file => {
                return <span>{file.fileName}</span>
            })}
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
            <Button type="submit">Ask GitAI!</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;

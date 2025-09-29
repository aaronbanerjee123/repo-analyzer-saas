"use client";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import React from "react";
import useProject from "~/hooks/use-project";
import CommitLog from "./commit-log";
import AskQuestionCard from "./ask-question-card";
import MeetingCard from "./meeting-card";

const DashboardPage = () => {
  const { project } = useProject();
  return (
    <div>
      {project?.id}
      <div className="flex items-center justify-between flex-wrap gap-y-4">

        <div className="w-fit rounded-md bg-primary px-4 py-3">
          <div className="flex items-center">
          <Github className="size-5 text-white" />
          <div className="ml-2">
            <p className="text-sm text-white">This project is linked to {' '}
              <Link href={project?.githubUrl ?? ''} target="_blank" className="font-medium underline flex">
                {project?.githubUrl}
                <ExternalLink className="ml-1 size-4" />
              </Link>
            </p>
          </div>
        </div>
        </div>

        <div className="h-4"></div>

        <div className="flex items-center gap-4">
          TeamMembers
          InviteButton
          ArchieveButton
        </div>
      </div>


      <div className="mt-4">
        <div className="flex items-center justify-start gap-4">
          <AskQuestionCard /> 
          <MeetingCard />
        </div>
      </div>

      <div className="mt-8">
        <CommitLog />
      </div>
    </div>
  );
};

export default DashboardPage;

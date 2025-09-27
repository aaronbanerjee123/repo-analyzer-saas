"use client";
import { Monitor, User } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import useRefetch from './../../../hooks/use-refresh';

type FormInput = {
  repoUrl: string;
  projectName: string;
  githubToken?: string;
};

const CreatePage = () => {
  const createProject = api.project.createProject.useMutation();
  const refetch = useRefetch();
  const onSubmit = (data: FormInput) => {
    createProject.mutate(
      {
        githubUrl: data.repoUrl,
        name: data.projectName,
        githubToken: data.githubToken,
      },
      {
        onSuccess: () => {
          toast.success("Project created successfully");
          refetch();
          reset();
        },
        onError: (err) => {
          toast.error(err.message);
        },
      },
    );
    return true;
  };
  const { register, handleSubmit, reset } = useForm<FormInput>();
  return (
    <div className="flex h-full items-center justify-center gap-12">
      <img src="/programmer.svg" alt="programmer" className="h-32" />
      <div>
        <div>
          <h1 className="text-2xl font-semibold">
            Link your GitHub Repository
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter the URL of your repository to link it to GitAi
          </p>
        </div>
        <div className="h-4"></div>
        <div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Input
              {...register("projectName")}
              placeholder="Project name"
              required
            />
            <div className="h-2"></div>
            <Input {...register("repoUrl")} placeholder="Github url" required />
            <div className="h-2"></div>
            <Input
              {...register("githubToken")}
              placeholder="Github token (optional)"
            />
            <div className="h-4"></div>
            <Button type="submit" disabled={createProject.isPending}>Create Project</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;

import {Octokit} from "octokit";
import { db } from "~/server/db";
import { redirect } from 'next/navigation';

export const octokit = new Octokit({
    auth:process.env.GITHUB_TOKEN
})

const githubUrl = "https://github.com/aaronbanerjee123/ai-resume-analyzer-saas.git";


type Response = {
    commitHash:string;
    commitMessage:string;
    commitAuthorName:string;
    commitAuthorAvatar:string;
    commitDate:string; 
}

export const getCommitHashes = async (githubUrl:string):Promise<Response[]> => {
    const [owner,repo] = githubUrl.split("/").slice(-2);
    const repoName = repo?.replace('.git','');
    const {data} = await octokit.rest.repos.listCommits({
        owner:owner,
        repo:repoName,
    })

    console.log(data);

    const sortedCommits = data.sort((a,b) => new Date(b.commit.author?.date || '').getTime() - new Date(a.commit.author?.date || '').getTime());

    return sortedCommits.slice(0,10).map((commit) => ({
        commitHash:commit.sha as string,
        commitMessage:commit.commit.message ?? "",
        commitAuthorName:commit.commit.author?.name ?? "",
        commitAuthorAvatar:commit.author?.avatar_url ?? "",
        commitDate:commit.commit.author?.date ?? "",
    })) 
}


export const pollCommits = async(projectId:string) => {
    const {project,githubUrl} = await fetchProjectGithubUrl(projectId);
    const commitHashes = await getCommitHashes(githubUrl as string);
    const unprocessedCommits = await filterUnprocessedCommits(projectId,commitHashes);
    return unprocessedCommits;
}

// async function summarizeCommit(githubUrl:string,commitHash:string){

// }


async function fetchProjectGithubUrl(projectId:string) {
    const project = await db.project.findUnique({
        where:{id:projectId},
        select:{
            githubUrl:true
        }
    })
    if(!project?.githubUrl){
        throw new Error('Project not found');
    }
    return {project,githubUrl:project?.githubUrl}
}


async function filterUnprocessedCommits(projectId:string, commitHashes:Response[]){
    const processedCommits = await db.commit.findMany({
        where:{projectId}
    });

    const unprocessedCommits = commitHashes.filter(commit => !(processedCommits.some(pc => pc.hash === commit.commitHash)));
    return unprocessedCommits;
}


await pollCommits('cmfzyco7h000up8eobuc82c4f').then(console.log);
// console.log(getCommitHashes(githubUrl));
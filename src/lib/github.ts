import {Octokit} from "octokit";
import { db } from "~/server/db";
import { redirect } from 'next/navigation';
import axios from "axios";
import { aiSummariseCommit } from "./gemini";

export const octokit = new Octokit({
    auth:process.env.GITHUB_TOKEN
})



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

    // console.log(data);

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


    const summaryResponses = await Promise.allSettled(unprocessedCommits.map(commit => {
        return summariseCommit(githubUrl, commit.commitHash)
    }))

    const summaries = summaryResponses.map((response) => {
        if(response.status === 'fulfilled'){
            return response.value;
        }
        return "";
    })

    const commits = await db.commit.createMany({
        data:summaries.map((summary,index) => {
            console.log(`processing commit ${index+1}`);
            console.log('Summary:', summary);
            return {
                projectId:projectId,
                commitHash:unprocessedCommits[index]?.commitHash || '',
                commitMessage:unprocessedCommits[index]?.commitMessage || '',
                commitAuthorName:unprocessedCommits[index]?.commitAuthorName || '',
                commitAuthorAvatar:unprocessedCommits[index]?.commitAuthorAvatar || '',
                commitDate:unprocessedCommits[index]?.commitDate || '',
                summary:summary,
            }
        })
    })
    return commits;
}

async function summariseCommit(githubUrl:string,commitHash:string){
    const {data} = await axios.get(`${githubUrl}/commit/${commitHash}.diff`,{headers:{
        Accept:'application/vnd.github.v3.diff'
    }});

    return await aiSummariseCommit(data) || '';
}


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

    const unprocessedCommits = commitHashes.filter(commit => !(processedCommits.some(pc => pc.commitHash === commit.commitHash)));
    return unprocessedCommits;
}


// console.log(getCommitHashes(githubUrl));
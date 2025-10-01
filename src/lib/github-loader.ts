import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github';
import {Document} from '@langchain/core/documents';
import { generateEmbedding, summariseCode } from './gemini';
import { db } from '~/server/db';

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(githubUrl, {
        accessToken: githubToken || '',
        branch: 'main',
        ignoreFiles: ['package-lock.json', 'yarn.lock'],
        recursive: true,
        unknown: 'warn',
        maxConcurrency: 5
    });
    const docs = await loader.load();
    return docs;
};

export const indexGithubRepo = async(projectId:string, githubUrl:string, githubToken?:string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken);
    
    // Process files one at a time with rate limiting
    for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        console.log(`Processing file ${i + 1}/${docs.length}: ${doc.metadata.source}`);
        
        try {
            // Generate summary
            const summary = await summariseCode(doc);
            
            // Small delay between summary and embedding
            await new Promise(resolve => setTimeout(resolve, 12000));
            
            // Generate embedding
            const embedding = await generateEmbedding(summary);
            
            // Save to database
            const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
                data: {
                    summary,
                    sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
                    fileName: doc.metadata.source,
                    projectId
                }
            });

            await db.$executeRaw`
                UPDATE "SourceCodeEmbedding"
                SET "summaryEmbedding" = ${embedding}::vector
                WHERE "id" = ${sourceCodeEmbedding.id}
            `;
            
            console.log(`✅ Processed: ${doc.metadata.source}`);
            
            // Wait 7 seconds between files to stay under rate limit (10 req/min)
            // This allows 2 API calls per file (summary + embedding)
            if (i < docs.length - 1) {
                console.log(`⏳ Waiting 8s before next file...`);
                await new Promise(resolve => setTimeout(resolve, 12000));
            }
        } catch (error) {
            console.error(`❌ Failed to process ${doc.metadata.source}:`, error);
            // Continue with next file instead of failing entire process
        }
    }
    
    console.log(`🎉 Indexing complete! Processed ${docs.length} files`);
}
 
const generateEmbeddings = async(docs:Document[]) => {
    return await Promise.all(docs.map(async doc => {
        const summary = await summariseCode(doc);
        const embedding = await geneurateEmbedding(summary);
        return {
            summary,
            embedding,
            sourceCode:JSON.parse(JSON.stringify(doc.pageContent)),
            fileName:doc.metadata.source,
        }
    }))
}
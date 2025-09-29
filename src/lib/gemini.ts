import {GoogleGenerativeAI} from '@google/generative-ai';
import "dotenv/config";
import {Document} from '@langchain/core/documents';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({
    model:'gemini-2.5-flash',
})

export const aiSummariseCommit = async (commitDiff: string) => {
  try {
    // Fetch the commit page content
  


    const prompt = `You are an expert programmer, and you are trying to summarize a git commit.
Reminders about the git diff format:
For every file, there are a few metadata lines, like (for example):
\`\`\`
diff --git a/lib/index.js b/lib/index.js
index aacf603..b0f64d4 100644
--- a/lib/index.js
+++ b/lib/index.js
\`\`\`

This means that \`lib/index.js\` was modified in this commit. Note that this is a simplified example.
Then there is a specifier of the lines that were modified.
A line starting with \`+\` means that line was added.
A line starting with \`-\` means that line was deleted.
A line that starts with neither \`+\` nor \`-\` is code given for context and it is not part of the diff.

EXAMPLE SUMMARY COMMENTS:
\`\`\`
- Raised the amount of returned recordings from \`40\` to \`100\` [packages/server/recordings.js]
- Fixed a typo in the github action name [.github/workflows/api-commit-summary.yml]
- Moved the \`octokitLib\` initialization to a separate file [src/octokit.ts], [src/index.ts]
- Added an OpenAI API key validation [packages/utils/apis/openai.ts]
- Lowered numeric tolerance for test files
- Updated commit message to have less comments than this example list
\`\`\`

Please summarize the following git commit page content:

\`\`\`
${commitDiff}
\`\`\`

Provide a concise summary of the changes made in this commit. Focus on what was changed and why, following the format shown in the examples above.`;

    const aiResponse = await model.generateContent(prompt);
    
    if (!aiResponse.response.text()) {
      throw new Error('Failed to generate commit summary');
    }

    console.log('The AI response for commit summary:', aiResponse.response.text().trim());

    return aiResponse.response.text().trim();

  } catch (error) {
    console.error('Error summarizing commit:', error);
    return {
      summary: `Failed to summarize commit: ${error.message}`,
      success: false
    };
  }
};
export async function summariseCode(doc: Document) {
  console.log("getting summary for", doc.metadata.source);
  const code = doc.pageContent.slice(0, 10000); // Limit to 10000 characters
  const response = await model.generateContent([
    `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.
You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
Here is the code:

${code}

Give a summary no more than 100 words of the code above.`,
  ]);

  return response.response.text();
}

export async function generateEmbedding(summary:string){
  const model = genAI.getGenerativeModel({
    model:"text-embedding-004"
  })

  const result = await model.embedContent(summary);
  const embedding = result.embedding;
  return embedding.values;
}


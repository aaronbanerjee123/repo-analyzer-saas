import { TabsContent } from '@radix-ui/react-tabs';
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { cn } from '~/lib/utils';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { lucario } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Props = {
  fileReferences: { fileName: string; sourceCode: string; summary: string }[];
}

const CodeReferences = ({ fileReferences }: Props) => {
//   const [tab, setTab] = React.useState(fileReferences[0]?.fileName);

  if (!fileReferences || fileReferences.length === 0) return null;

  return (
    <Tabs defaultValue={fileReferences[0]?.fileName} className="w-full">
      <div className="overflow-x-auto">
        <TabsList className="w-full justify-start">
          {fileReferences.map(file => (
            <TabsTrigger 
              key={file.fileName} 
              value={file.fileName}
              className="whitespace-nowrap"
            >
              {file.fileName}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {fileReferences.map(file => (
        <TabsContent 
          key={file.fileName} 
          value={file.fileName} 
          className="max-h-[40vh] overflow-auto rounded-md border mt-2"
        >
          <SyntaxHighlighter 
            language='typescript' 
            style={lucario}
            customStyle={{ margin: 0, borderRadius: '0.375rem' }}
          >
            {file.sourceCode}
          </SyntaxHighlighter>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default CodeReferences;
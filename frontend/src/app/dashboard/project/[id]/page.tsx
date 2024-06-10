"use client";
import { useState } from 'react';
import Editor from '@monaco-editor/react';

import ActionBar from '~/components/project/action-bar';

export interface ProjectViewProps {
    params: {
        id: string;
    };
};

export default function ProjectView({
    params: { id },
}: ProjectViewProps){
    const [code, setCode] = useState('// Write your code here');

    const handleEditorChange = (value?: string, event?: unknown) => {
        if (value) setCode(value);
    };
    return (
        <section className="flex flex-col w-full">
            <ActionBar/>
            <Editor
                height="100%"
                defaultLanguage="javascript"
                defaultValue="// some comment"
                theme='vs-dark'
                value={code}
                onChange={handleEditorChange}
            />
        </section>
    );
};

function App() {
    return ;
  }
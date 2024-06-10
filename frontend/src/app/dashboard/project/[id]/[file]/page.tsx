"use client";
import { useState } from 'react';
import Editor from '@monaco-editor/react';

import ActionBar from '~/components/project/action-bar';

export interface FileViewProps {
    params: {
        id: string;
        file: string;
    };
};

export default function FileView({
    params: { id, file },
}: FileViewProps){
    const [code, setCode] = useState(`${id} - ${file}`);

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
"use client";
import { useState } from 'react';

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

    return (
        <section className="flex flex-col w-full h-screen">
            <ActionBar/>
            <div className="flex-1 p-4">
                <textarea
                    className="w-full h-full bg-gray-900 text-green-400 font-mono text-sm p-4 border rounded resize-none"
                    placeholder="// File editor functionality temporarily simplified"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
            </div>
        </section>
    );
};
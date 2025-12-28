
import React from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center border-b border-gray-700">
        <span className="text-xs font-mono text-gray-400">scripts/main.js</span>
        <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 w-full h-full p-4 bg-transparent font-mono text-sm outline-none resize-none text-green-400 leading-relaxed"
        placeholder="// Write your Minecraft Script API code here..."
      />
    </div>
  );
};

export default Editor;

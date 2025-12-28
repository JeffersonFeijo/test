
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Download, 
  Settings, 
  Code2, 
  Sparkles, 
  Box, 
  Info, 
  RefreshCw,
  Layout,
  FileCode,
  Zap
} from 'lucide-react';
import JSZip from 'jszip';
import { AddonProject, AddonMetadata } from './types';
import { generateUUID } from './utils/uuid';
import { generateMinecraftScript } from './services/geminiService';
import Editor from './components/Editor';

const DEFAULT_SCRIPT = `import { world, system } from "@minecraft/server";

// Welcome to Minecraft Bedrock Scripting!
// This script runs on the server side of your addon.

world.afterEvents.worldInitialize.subscribe(() => {
    console.warn("Addon Loaded Successfully!");
});

world.beforeEvents.chatSend.subscribe((event) => {
    const { sender, message } = event;
    
    if (message === "!ping") {
        system.run(() => {
            sender.sendMessage("Pong! §aAddon is active.");
        });
    }
});`;

const App: React.FC = () => {
  const [project, setProject] = useState<AddonProject>({
    metadata: {
      name: "My Awesome Addon",
      description: "Created with Addon Creator Pro",
      version: [1, 0, 0],
      author: "Crafter",
      namespace: "my_addon"
    },
    uuids: {
      header: generateUUID(),
      module: generateUUID()
    },
    scriptContent: DEFAULT_SCRIPT
  });

  const [activeTab, setActiveTab] = useState<'config' | 'code'>('code');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const updateMetadata = (key: keyof AddonMetadata, value: any) => {
    setProject(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value }
    }));
  };

  const regenerateUUIDs = () => {
    setProject(prev => ({
      ...prev,
      uuids: { header: generateUUID(), module: generateUUID() }
    }));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    const code = await generateMinecraftScript(aiPrompt);
    setProject(prev => ({ ...prev, scriptContent: code }));
    setIsGenerating(false);
    setAiPrompt("");
  };

  const exportAddon = async () => {
    const zip = new JSZip();
    const { metadata, uuids, scriptContent } = project;
    
    // Create BP Folder
    const bpName = `${metadata.name.replace(/\s+/g, '_')}_BP`;
    const bp = zip.folder(bpName);

    if (!bp) return;

    // manifest.json
    const manifest = {
      format_version: 2,
      header: {
        name: metadata.name,
        description: metadata.description,
        uuid: uuids.header,
        version: metadata.version,
        min_engine_version: [1, 20, 0]
      },
      modules: [
        {
          description: "Scripting Module",
          type: "script",
          language: "javascript",
          uuid: uuids.module,
          version: [1, 0, 0],
          entry: "scripts/main.js"
        }
      ],
      dependencies: [
        {
          module_name: "@minecraft/server",
          version: "1.7.0"
        },
        {
          module_name: "@minecraft/server-ui",
          version: "1.2.0"
        }
      ]
    };

    bp.file("manifest.json", JSON.stringify(manifest, null, 2));
    bp.folder("scripts")?.file("main.js", scriptContent);

    // RP Folder (Minimal)
    const rpName = `${metadata.name.replace(/\s+/g, '_')}_RP`;
    const rp = zip.folder(rpName);
    if (rp) {
        const rpManifest = {
            format_version: 2,
            header: {
                name: `${metadata.name} RP`,
                description: metadata.description,
                uuid: generateUUID(),
                version: metadata.version,
                min_engine_version: [1, 20, 0]
            },
            modules: [
                {
                    description: "Resource Pack Module",
                    type: "resources",
                    uuid: generateUUID(),
                    version: [1, 0, 0]
                }
            ]
        };
        rp.file("manifest.json", JSON.stringify(rpManifest, null, 2));
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${metadata.name.replace(/\s+/g, '_')}.mcaddon`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-6 space-y-8">
        <div className="p-3 bg-green-600 rounded-xl shadow-lg shadow-green-900/20">
          <Box className="w-6 h-6 text-white" />
        </div>
        
        <nav className="flex flex-col space-y-4">
          <button 
            onClick={() => setActiveTab('code')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'code' ? 'bg-gray-800 text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Code2 className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`p-3 rounded-xl transition-all ${activeTab === 'config' ? 'bg-gray-800 text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Settings className="w-6 h-6" />
          </button>
        </nav>

        <div className="mt-auto">
          <button onClick={exportAddon} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all text-white shadow-lg shadow-blue-900/20">
            <Download className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-bold tracking-tight text-white">{project.metadata.name}</h1>
            <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] font-mono rounded border border-gray-700">
              v{project.metadata.version.join('.')}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
               <button 
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeTab === 'code' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400'}`}
               >
                 Editor
               </button>
               <button 
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${activeTab === 'config' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400'}`}
               >
                 Manifest
               </button>
            </div>
            <button 
              onClick={exportAddon}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-green-900/20 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Compile .mcaddon</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {activeTab === 'code' ? (
            <div className="flex-1 flex flex-col space-y-4">
              {/* AI Assistant Bar */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center space-x-4 shadow-xl">
                <div className="flex items-center space-x-2 text-purple-400">
                   <Sparkles className="w-5 h-5" />
                   <span className="text-xs font-bold uppercase tracking-wider">AI Script Assistant</span>
                </div>
                <input 
                  type="text" 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. 'Create a script that gives speed to players when they sneak'"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button 
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>Generate</span>
                </button>
              </div>

              {/* Code Editor */}
              <div className="flex-1 min-h-0">
                <Editor 
                  value={project.scriptContent} 
                  onChange={(val) => setProject(p => ({ ...p, scriptContent: val }))} 
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full pb-10">
              <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center space-x-2 border-b border-gray-800 pb-4">
                  <Layout className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-semibold">General Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Addon Name</label>
                    <input 
                      type="text" 
                      value={project.metadata.name}
                      onChange={(e) => updateMetadata('name', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Author</label>
                    <input 
                      type="text" 
                      value={project.metadata.author}
                      onChange={(e) => updateMetadata('author', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all text-sm"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
                    <textarea 
                      value={project.metadata.description}
                      onChange={(e) => updateMetadata('description', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all text-sm h-24 resize-none"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-5 h-5 text-orange-400" />
                    <h2 className="text-lg font-semibold">Identity & Manifest</h2>
                  </div>
                  <button 
                    onClick={regenerateUUIDs}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate UUIDs</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 border border-gray-800 rounded-xl font-mono text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Header UUID:</span>
                      <span className="text-green-500">{project.uuids.header}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Module UUID:</span>
                      <span className="text-green-500">{project.uuids.module}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-4 bg-blue-900/10 border border-blue-900/20 rounded-xl">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-300 leading-relaxed">
                      Minecraft Bedrock uses unique identifiers (UUIDs) to distinguish between different addons. Each time you start a new project, we generate fresh UUIDs for you.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;

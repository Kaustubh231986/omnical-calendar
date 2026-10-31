import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Check,
  Copy,
  Terminal,
  Server,
  Mail,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  GitCommit,
  FolderGit2,
} from 'lucide-react';

interface VideoWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEmailGateway?: () => void;
}

interface Chapter {
  id: number;
  title: string;
  timestamp: string;
  startSeconds: number;
  endSeconds: number;
  description: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'Deploying on Another Machine',
    timestamp: '00:00',
    startSeconds: 0,
    endSeconds: 60,
    description: 'Clone repository, install dependencies, run with Docker or Node.js on port 3000.',
  },
  {
    id: 2,
    title: 'Configuring Multiple Email IDs',
    timestamp: '01:00',
    startSeconds: 60,
    endSeconds: 125,
    description: 'Partition isolated sender emails per company (Mandar, Agharkar, Rajadhyaksha, NBC).',
  },
  {
    id: 3,
    title: '24h Advance Alerts & Notes Sync',
    timestamp: '02:05',
    startSeconds: 125,
    endSeconds: 185,
    description: 'Pre-meeting agendas, attendance quorums, post-meeting action items, and account sync.',
  },
  {
    id: 4,
    title: 'Category A Client Governance',
    timestamp: '03:05',
    startSeconds: 185,
    endSeconds: 240,
    description: 'Mandatory 30-day monthly updates, 90-day QBRs, and automated team reminders.',
  },
  {
    id: 5,
    title: 'GitLab & GitHub Upload',
    timestamp: '04:00',
    startSeconds: 240,
    endSeconds: 300,
    description: 'Upload codebase to GitLab or GitHub with remote origin, SSH keys, or Personal Access Tokens.',
  },
];

const TOTAL_DURATION = 300; // 5 minutes

export const VideoWalkthroughModal: React.FC<VideoWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onOpenEmailGateway,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'gitlab' | 'docker' | 'node' | 'env' | 'apppass'>('gitlab');
  const [repoPlatform, setRepoPlatform] = useState<'gitlab' | 'github'>('gitlab');
  const [customRepoUrl, setCustomRepoUrl] = useState('https://gitlab.com/kaustubh/omnical-calendar.git');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Playback loop timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && isOpen) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= TOTAL_DURATION) {
            setIsPlaying(false);
            return TOTAL_DURATION;
          }
          return prev + 1 * playbackSpeed;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isOpen, playbackSpeed]);

  if (!isOpen) return null;

  const currentChapter =
    CHAPTERS.find((c) => currentTime >= c.startSeconds && currentTime < c.endSeconds) ||
    CHAPTERS[CHAPTERS.length - 1];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handleSeek = (newSeconds: number) => {
    setCurrentTime(Math.min(TOTAL_DURATION, Math.max(0, newSeconds)));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-100">
                  Interactive Video Walkthrough: Deployment & Multi-Email Configuration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  1080p HD Guide
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Step-by-step visual demonstration of deploying to another machine and configuring multiple sender mailboxes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* ======================================================== */}
          {/* VIDEO PLAYER SCREEN / SIMULATOR VIEWPORT                 */}
          {/* ======================================================== */}
          <div className="bg-black rounded-xl border border-neutral-800 overflow-hidden shadow-2xl relative flex flex-col">
            {/* Video Canvas / Screen Visualizer */}
            <div className="relative aspect-video w-full bg-neutral-950 flex flex-col justify-between overflow-hidden p-4 md:p-8 select-none">
              {/* Subtle CRT scanline overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />

              {/* Top Watermark & Chapter Marker inside video */}
              <div className="relative z-10 flex items-center justify-between text-xs text-neutral-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-neutral-200 font-bold uppercase tracking-wider text-[11px]">
                    OmniCal Enterprise · Chapter {currentChapter.id}
                  </span>
                </div>
                <div className="bg-neutral-900/80 px-2 py-1 rounded border border-neutral-800 text-[11px] text-neutral-300">
                  {currentChapter.title}
                </div>
              </div>

              {/* ========================================== */}
              {/* DYNAMIC SCENE CONTENT BASED ON TIMELINE   */}
              {/* ========================================== */}
              <div className="relative z-10 flex-1 flex items-center justify-center my-4">
                {/* SCENE 1: Terminal & Machine Deployment (0s - 70s) */}
                {currentChapter.id === 1 && (
                  <div className="w-full max-w-2xl bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-4 font-mono text-xs shadow-2xl backdrop-blur-md">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3 text-[11px] text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                        <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                        <span className="ml-2 text-neutral-300 font-sans font-medium">
                          bash: deploy-target-server ~ (port 3000)
                        </span>
                      </div>
                      <span className="text-neutral-500 font-mono">Docker & Node.js</span>
                    </div>

                    <div className="space-y-2 text-[12px] leading-relaxed">
                      <div className="text-neutral-400">
                        <span className="text-emerald-400 font-bold">$</span> git clone https://github.com/your-org/omnical-enterprise.git
                      </div>
                      <div className="text-neutral-400">
                        <span className="text-emerald-400 font-bold">$</span> cd omnical-enterprise
                      </div>
                      <div className="text-indigo-300 font-semibold">
                        <span className="text-emerald-400 font-bold">$</span> docker compose up -d
                      </div>
                      <div className="text-neutral-500 text-[11px] pl-3 py-1 space-y-0.5 border-l-2 border-indigo-500/40">
                        <div>[+] Building 8.4s (12/12) FINISHED</div>
                        <div className="text-emerald-400 font-semibold">
                          ✔ Container omnical-master-calendar Created
                        </div>
                        <div className="text-emerald-400 font-semibold">
                          ✔ Container omnical-master-calendar Started
                        </div>
                        <div className="text-neutral-300">
                          ✔ Ready on: <span className="text-sky-400 underline font-bold">http://localhost:3000</span> (0.0.0.0:3000)
                        </div>
                      </div>
                      <div className="text-amber-300 text-[11px] pt-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Production server active on target machine! Accessible across local network & web.
                      </div>
                    </div>
                  </div>
                )}

                {/* SCENE 2: Multi-Email Gateway Routing (70s - 150s) */}
                {currentChapter.id === 2 && (
                  <div className="w-full max-w-2xl bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-neutral-100 text-xs">
                          Isolated Multi-Tenant Mailbox Dispatcher
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Partitioned Routing
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-neutral-950 p-3 rounded-lg border border-purple-500/40">
                        <div className="flex items-center gap-1.5 font-bold text-purple-300">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          Mandar Kanitkar
                        </div>
                        <div className="text-[11px] font-mono text-neutral-300 mt-1">
                          From: mandar@kanitkar.com
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          Host: smtp.gmail.com:587
                        </div>
                      </div>

                      <div className="bg-neutral-950 p-3 rounded-lg border border-orange-500/40">
                        <div className="flex items-center gap-1.5 font-bold text-orange-300">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          Agharkar Food & Beverages
                        </div>
                        <div className="text-[11px] font-mono text-neutral-300 mt-1">
                          From: nitin@agharkarfoods.in
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          Host: smtp.mailgun.org:587
                        </div>
                      </div>

                      <div className="bg-neutral-950 p-3 rounded-lg border border-indigo-500/40">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          Rajadhyaksha Company
                        </div>
                        <div className="text-[11px] font-mono text-neutral-300 mt-1">
                          From: yogita@rajadhyakshaco.com
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          Host: smtp.office365.com:587
                        </div>
                      </div>

                      <div className="bg-neutral-950 p-3 rounded-lg border border-orange-500/40">
                        <div className="flex items-center gap-1.5 font-bold text-orange-300">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          NBC Company (Investmentz)
                        </div>
                        <div className="text-[11px] font-mono text-neutral-300 mt-1">
                          From: sandeep@investmentz.in
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          Host: smtp.sendgrid.net:587
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-300 bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex items-center justify-between">
                      <span>Each company brief/recap is dispatched strictly from its own email ID!</span>
                      <span className="text-emerald-400 font-mono font-semibold">Zero Cross-Bleed</span>
                    </div>
                  </div>
                )}

                {/* SCENE 3: 24h Advance Alerts & Notes Sync (150s - 215s) */}
                {currentChapter.id === 3 && (
                  <div className="w-full max-w-2xl bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-100">
                        <Clock className="w-4 h-4 text-sky-400" />
                        Automated 24h Advance Notice & Two-Way Sync
                      </div>
                      <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        Triggered -1 Day Before
                      </span>
                    </div>

                    <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-200">
                          Pre-Meeting Briefing Dispatched
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          Sent: 24h Ahead
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                        To: rahul.ahire@termplan.in · CC: assistant@kanitkar.com<br />
                        Subject: Agenda & Objectives for Term Plan Strategy (Sept 5)
                      </div>
                      <div className="text-[11px] text-neutral-300 italic bg-neutral-900 p-2 rounded">
                        "1. Review current sum assured. 2. Evaluate inflation adjustment riders."
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-950/20 p-2.5 rounded border border-emerald-500/20 font-mono">
                      <span>✔ Meeting notes vaulted back into isolated CRM partition</span>
                      <span className="text-neutral-400">Status: Synced</span>
                    </div>
                  </div>
                )}

                {/* SCENE 4: Category A Cadence & Reminders (215s - 270s) */}
                {currentChapter.id === 4 && (
                  <div className="w-full max-w-2xl bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-100">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Category A Client Tier Governance
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Mandatory Cadence
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        <div className="text-neutral-400 text-[11px]">Monthly Update</div>
                        <div className="text-base font-bold font-mono text-indigo-400 mt-1">
                          Every 30 Days
                        </div>
                      </div>
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        <div className="text-neutral-400 text-[11px]">Quarterly Review</div>
                        <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                          Every 90 Days
                        </div>
                      </div>
                      <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        <div className="text-neutral-400 text-[11px]">Auto Alert</div>
                        <div className="text-base font-bold font-mono text-amber-400 mt-1">
                          7d & 3d Advance
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-300 bg-neutral-950 p-2.5 rounded border border-neutral-800 flex items-center justify-between">
                      <span>Clicking 'Dispatch' automatically resets the cadence and advances +30 days</span>
                      <span className="text-indigo-400 font-mono font-semibold">100% SLA</span>
                    </div>
                  </div>
                )}

                {/* SCENE 5: GitLab & GitHub Push (240s - 300s) */}
                {currentChapter.id === 5 && (
                  <div className="w-full max-w-2xl bg-neutral-900/90 border border-neutral-700/80 rounded-xl p-5 shadow-2xl backdrop-blur-md space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-100">
                        <FolderGit2 className="w-4 h-4 text-orange-400" />
                        <span>GitLab Repository Deployment</span>
                      </div>
                      <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        Git Remote: main
                      </span>
                    </div>

                    <div className="bg-neutral-950 p-3.5 rounded-lg border border-neutral-800 font-mono text-xs space-y-2">
                      <div className="text-neutral-400">
                        <span className="text-emerald-400 font-bold">$</span> git remote add origin https://gitlab.com/username/omnical-calendar.git
                      </div>
                      <div className="text-neutral-400">
                        <span className="text-emerald-400 font-bold">$</span> git push -u origin main
                      </div>
                      <div className="text-neutral-500 text-[11px] pl-3 py-1 space-y-0.5 border-l-2 border-orange-500/40">
                        <div>Enumerating objects: 30, done.</div>
                        <div>Writing objects: 100% (30/30), 184.20 KiB | 8.37 MiB/s, done.</div>
                        <div className="text-emerald-400 font-semibold">
                          ✔ To https://gitlab.com/username/omnical-calendar.git
                        </div>
                        <div className="text-neutral-300">
                          * [new branch] main -&gt; main
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-orange-400 bg-orange-950/20 p-2.5 rounded border border-orange-500/20 font-mono">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Codebase backed up and version-controlled on GitLab!
                      </span>
                      <span className="text-neutral-400 text-[11px]">Branch: main</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitle / Narration Bar */}
              <div className="relative z-10 bg-neutral-900/90 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 text-center shadow-lg backdrop-blur-md">
                <span className="font-semibold text-indigo-400 mr-2">Narration:</span>
                <span>{currentChapter.description}</span>
              </div>
            </div>

            {/* Video Controls Toolbar */}
            <div className="bg-neutral-950 p-3 border-t border-neutral-800 flex flex-col gap-2.5">
              {/* Progress Scrubbing Bar */}
              <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                <span className="tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = (e.clientX - rect.left) / rect.width;
                    handleSeek(ratio * TOTAL_DURATION);
                  }}
                  className="flex-1 h-2 bg-neutral-800 rounded-full cursor-pointer relative overflow-hidden group"
                >
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all group-hover:bg-indigo-400"
                    style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
                  />
                  {/* Chapter tick marks */}
                  {CHAPTERS.map((ch) => (
                    <div
                      key={ch.id}
                      className="absolute top-0 bottom-0 w-0.5 bg-neutral-700 pointer-events-none"
                      style={{ left: `${(ch.startSeconds / TOTAL_DURATION) * 100}%` }}
                      title={ch.title}
                    />
                  ))}
                </div>
                <span className="tabular-nums w-10">{formatTime(TOTAL_DURATION)}</span>
              </div>

              {/* Controls Row: Play/Pause, Replay, Speed, Chapter Selector */}
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg border border-neutral-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTime(0);
                      setIsPlaying(true);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    title="Replay from start"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Speed toggle */}
                  <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg font-mono text-[11px]">
                    {[1, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          playbackSpeed === spd
                            ? 'bg-neutral-700 text-white font-bold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chapter jump buttons */}
                <div className="hidden sm:flex items-center gap-1 text-[11px]">
                  {CHAPTERS.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        handleSeek(ch.startSeconds);
                        setIsPlaying(true);
                      }}
                      className={`px-2 py-1 rounded transition-colors ${
                        currentChapter.id === ch.id
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                      }`}
                    >
                      Ch {ch.id}: {ch.title.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Configure Email button */}
                {onOpenEmailGateway && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEmailGateway();
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open Email Settings</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* QUICK-COPY COMMAND DECK (Below Video)                     */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-xs font-bold text-neutral-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Quick Copy Command Deck (Run on Target Machine)
              </h3>
              <div className="flex items-center gap-1 text-xs overflow-x-auto">
                <button
                  onClick={() => setActiveTab('gitlab')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'gitlab'
                      ? 'bg-orange-600/30 text-orange-200 font-semibold border border-orange-500/50'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>GitLab / GitHub Upload</span>
                </button>
                <button
                  onClick={() => setActiveTab('docker')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    activeTab === 'docker'
                      ? 'bg-neutral-800 text-neutral-100 font-semibold border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Docker Compose
                </button>
                <button
                  onClick={() => setActiveTab('node')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    activeTab === 'node'
                      ? 'bg-neutral-800 text-neutral-100 font-semibold border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Node.js / Bare Metal
                </button>
                <button
                  onClick={() => setActiveTab('env')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    activeTab === 'env'
                      ? 'bg-neutral-800 text-neutral-100 font-semibold border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Environment File
                </button>
                <button
                  onClick={() => setActiveTab('apppass')}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    activeTab === 'apppass'
                      ? 'bg-neutral-800 text-neutral-100 font-semibold border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Google Multi-Email Setup
                </button>
              </div>
            </div>

            {/* TAB 0: GITLAB / GITHUB UPLOAD */}
            {activeTab === 'gitlab' && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-200 relative space-y-3 font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                  <div>
                    <span className="font-semibold text-neutral-100 flex items-center gap-1.5">
                      <FolderGit2 className="w-4 h-4 text-orange-400" />
                      Push to Your Remote Git Repository
                    </span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      The local git repo is already initialized with all files on the <code className="text-neutral-200 font-mono">main</code> branch.
                    </p>
                  </div>

                  {/* Platform toggle */}
                  <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg text-[11px] font-mono shrink-0">
                    <button
                      onClick={() => {
                        setRepoPlatform('gitlab');
                        if (customRepoUrl.includes('github.com')) {
                          setCustomRepoUrl('https://gitlab.com/kaustubh/omnical-calendar.git');
                        }
                      }}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        repoPlatform === 'gitlab'
                          ? 'bg-orange-600 text-white font-bold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      GitLab
                    </button>
                    <button
                      onClick={() => {
                        setRepoPlatform('github');
                        if (customRepoUrl.includes('gitlab.com')) {
                          setCustomRepoUrl('https://github.com/projects/omnical-calendar.git');
                        }
                      }}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        repoPlatform === 'github'
                          ? 'bg-neutral-700 text-white font-bold'
                          : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      GitHub
                    </button>
                  </div>
                </div>

                {/* Target Repo URL Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-neutral-300">
                    Your {repoPlatform === 'gitlab' ? 'GitLab' : 'GitHub'} Repository URL:
                  </label>
                  <input
                    type="text"
                    value={customRepoUrl}
                    onChange={(e) => setCustomRepoUrl(e.target.value)}
                    placeholder={
                      repoPlatform === 'gitlab'
                        ? 'https://gitlab.com/username/project.git'
                        : 'https://github.com/username/project.git'
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-100 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Generated Commands block */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 font-mono text-[11px] space-y-1 relative">
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 text-[10px] text-neutral-400 font-sans">
                    <span>Generated Git Commands for your terminal:</span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `# 1. Ensure branch is main\ngit branch -M main\n\n# 2. Add remote repository URL\ngit remote add origin ${customRepoUrl} 2>/dev/null || git remote set-url origin ${customRepoUrl}\n\n# 3. Push to ${repoPlatform === 'gitlab' ? 'GitLab' : 'GitHub'}\ngit push -u origin main`,
                          'gitlab_cmd'
                        )
                      }
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'gitlab_cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'gitlab_cmd' ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>
                  <pre className="text-neutral-300 overflow-x-auto leading-relaxed pt-1">
{`# 1. Ensure default branch is main
git branch -M main

# 2. Add remote repository URL (or update if already set)
git remote add origin ${customRepoUrl} 2>/dev/null || git remote set-url origin ${customRepoUrl}

# 3. Push all code to ${repoPlatform === 'gitlab' ? 'GitLab' : 'GitHub'}
git push -u origin main`}
                  </pre>
                </div>

                {/* Authentication Note */}
                <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80 text-[11px] space-y-1.5">
                  <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Authentication details:
                  </div>
                  <p className="text-neutral-400 leading-relaxed">
                    When prompted for your password during <code className="text-neutral-300">git push</code>, enter a <strong>GitLab Personal Access Token</strong> (with <code className="text-neutral-200">read_repository</code> and <code className="text-neutral-200">write_repository</code> scopes) from <em>GitLab &gt; Preferences &gt; Access Tokens</em>.
                  </p>
                  <p className="text-neutral-500 text-[10px]">
                    Detailed instructions are also in <code className="text-neutral-300">GITLAB_UPLOAD_GUIDE.md</code> in the project root.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 1: DOCKER COMPOSE */}
            {activeTab === 'docker' && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-200 relative space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-[11px] mb-2 font-sans">
                  <span>Run this 3-line command on your remote server or second computer:</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `# 1. Clone repository\ngit clone https://github.com/your-org/omnical-enterprise.git\ncd omnical-enterprise\n\n# 2. Launch with Docker Compose\ndocker compose up -d\n\n# 3. View running container status\ndocker compose ps`,
                        'docker_cmd'
                      )
                    }
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'docker_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'docker_cmd' ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre className="text-neutral-300 overflow-x-auto text-[11px] leading-relaxed">
{`# 1. Clone the repository
git clone https://github.com/your-org/omnical-enterprise.git
cd omnical-enterprise

# 2. Build & launch in detached mode on port 3000
docker compose up -d

# 3. Open browser at http://localhost:3000`}
                </pre>
              </div>
            )}

            {/* TAB 2: NODE.JS BARE METAL */}
            {activeTab === 'node' && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-200 relative space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-[11px] mb-2 font-sans">
                  <span>Standard Node.js (v20+) commands for Windows, Linux, or macOS:</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `git clone https://github.com/your-org/omnical-enterprise.git\ncd omnical-enterprise\nnpm install\nnpm run build\nnpm run preview -- --port 3000 --host 0.0.0.0`,
                        'node_cmd'
                      )
                    }
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'node_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'node_cmd' ? 'Copied!' : 'Copy Commands'}</span>
                  </button>
                </div>
                <pre className="text-neutral-300 overflow-x-auto text-[11px] leading-relaxed">
{`git clone https://github.com/your-org/omnical-enterprise.git
cd omnical-enterprise
npm install
npm run build

# Start preview server binding to all network interfaces:
npm run preview -- --port 3000 --host 0.0.0.0

# Optional: Keep running in background with PM2:
npm install -g pm2
pm2 start "npm run preview" --name "omnical-app"`}
                </pre>
              </div>
            )}

            {/* TAB 3: ENVIRONMENT FILE */}
            {activeTab === 'env' && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-200 relative space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-[11px] mb-2 font-sans">
                  <span>Create <code className="text-indigo-300">.env.production</code> in project root:</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `PORT=3000\nNODE_ENV=production\nAPP_URL=http://localhost:3000\nDEFAULT_SMTP_HOST=smtp.gmail.com\nDEFAULT_SMTP_PORT=587\nDEFAULT_SMTP_USER=email.kaustubh@gmail.com`,
                        'env_cmd'
                      )
                    }
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'env_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'env_cmd' ? 'Copied!' : 'Copy .env'}</span>
                  </button>
                </div>
                <pre className="text-neutral-300 overflow-x-auto text-[11px] leading-relaxed">
{`PORT=3000
NODE_ENV=production
APP_URL=http://localhost:3000

# Global fallback email credentials
DEFAULT_SMTP_HOST=smtp.gmail.com
DEFAULT_SMTP_PORT=587
DEFAULT_SMTP_USER=email.kaustubh@gmail.com
DEFAULT_SMTP_PASSWORD=your-google-app-password`}
                </pre>
              </div>
            )}

            {/* TAB 4: GOOGLE MULTI-EMAIL APP PASSWORDS */}
            {activeTab === 'apppass' && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs text-neutral-300 leading-relaxed space-y-2">
                <h4 className="font-semibold text-neutral-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Generating App Passwords for Each Company Email Address
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400 text-[11px]">
                  <li>Log in to the Google/Gmail account for the respective company (e.g. <code className="text-neutral-200">mandar@kanitkar.com</code>).</li>
                  <li>Enable <strong>2-Step Verification</strong> at <code className="text-indigo-400">myaccount.google.com/security</code>.</li>
                  <li>Navigate to <strong>App Passwords</strong> (<code className="text-indigo-400">myaccount.google.com/apppasswords</code>).</li>
                  <li>Generate a password with app name <em>"OmniCal Calendar Dispatcher"</em>.</li>
                  <li>In OmniCal, open <strong>Company Profiles</strong> &gt; <strong>Configure Email Gateway</strong> and paste the password.</li>
                  <li>Repeat for other companies (Agharkar, Rajadhyaksha, NBC) to establish independent outbound pipelines.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between text-xs text-neutral-400">
          <span>Documentation file: <code className="text-neutral-300 font-mono">DEPLOYMENT_AND_EMAIL_SETUP.md</code> created in project root</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg font-medium cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

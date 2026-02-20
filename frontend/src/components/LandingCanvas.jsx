import {
  FaTwitter, FaInstagram, FaLinkedinIn,
  FaRedditAlien, FaPinterestP, FaMediumM
} from 'react-icons/fa';

const iconData = [
  { Icon: FaTwitter, cx: 80, cy: 140, side: 'left' },
  { Icon: FaLinkedinIn, cx: 80, cy: 350, side: 'left' },
  { Icon: FaInstagram, cx: 80, cy: 560, side: 'left' },
  { Icon: FaRedditAlien, cx: 1320, cy: 140, side: 'right' },
  { Icon: FaMediumM, cx: 1320, cy: 350, side: 'right' },
  { Icon: FaPinterestP, cx: 1320, cy: 560, side: 'right' },
];

const centerLeftX = 520;
const centerRightX = 880;
const centerY = 320;

export default function LandingPage() {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black">

      <div className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, rgba(0,229,255,0.07) 0%, transparent 50%),
            linear-gradient(225deg, rgba(0,229,255,0.07) 0%, transparent 50%),
            linear-gradient(315deg, rgba(0,200,230,0.05) 0%, transparent 50%),
            linear-gradient(45deg, rgba(0,200,230,0.05) 0%, transparent 50%)
          `,
        }}
      />

      <div className="absolute w-[800px] h-[800px] rounded-full opacity-[0.25]"
        style={{
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.7) 0%, rgba(0, 180, 220, 0.2) 35%, transparent 65%)',
          top: '-5%', right: '-10%', filter: 'blur(50px)',
        }}
      />
      <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.18]"
        style={{
          background: 'radial-gradient(circle, rgba(0, 229, 255, 0.6) 0%, rgba(0, 200, 240, 0.15) 40%, transparent 65%)',
          bottom: '-5%', left: '5%', filter: 'blur(40px)',
        }}
      />
      <div className="absolute w-[350px] h-[350px] rounded-full opacity-[0.12]"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 200, 0.5) 0%, rgba(0, 229, 255, 0.1) 50%, transparent 70%)',
          top: '40%', left: '30%', filter: 'blur(50px)',
        }}
      />

      <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 1400 700" preserveAspectRatio="xMidYMid meet">
        {iconData.map((icon, i) => {
          const endX = icon.side === 'left' ? centerLeftX : centerRightX;
          const offset = (icon.cy - 350) * 0.15;
          const endY = centerY + offset;
          const d = `M ${icon.cx} ${icon.cy} L ${endX} ${endY}`;
          return (
            <g key={i}>
              <line x1={icon.cx} y1={icon.cy} x2={endX} y2={endY}
                stroke="rgba(0, 229, 255, 0.12)" strokeWidth="1.5" />
              <path d={d} fill="none" stroke="rgba(0, 229, 255, 0.4)" strokeWidth="1.5"
                strokeDasharray="8 14"
                className={icon.side === 'left' ? 'beam-flow-left' : 'beam-flow-right'}
                style={{ animationDelay: `${i * 0.25}s` }}
              />
            </g>
          );
        })}

        {iconData.map((icon, i) => {
          const r = 28;
          return (
            <g key={`icon-${i}`} className="icon-node cursor-pointer">
              <circle cx={icon.cx} cy={icon.cy} r={r + 6}
                fill="none" stroke="rgba(0, 229, 255, 0)" strokeWidth="1.5"
                className="icon-glow-ring" />
              <circle cx={icon.cx} cy={icon.cy} r={r}
                fill="rgba(0,0,0,0.7)" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="1.5"
                className="icon-circle" />
              <foreignObject
                x={icon.cx - 14} y={icon.cy - 14}
                width="28" height="28"
              >
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <icon.Icon className="icon-inner" style={{ color: 'rgba(0, 229, 255, 0.7)', fontSize: '18px' }} />
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>

      <div className="relative z-20 flex flex-col gap-2 items-center text-center px-6 max-w-3xl">

        <div className="flex gap-4 text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.95] select-none mb-6">
          <span className="text-white">Social</span>
          <span className="text-cyan-400">Synapse</span>
        </div>

        <p className="text-white/45 text-base md:text-lg lg:text-xl font-light leading-relaxed max-w-lg mb-10">
          Turn your saved posts into an AI-searchable second brain.
        </p>

        <div className='flex gap-4'>
            <button className='rounded-lg bg-cyan-400 text-black px-6 py-3 text-sm font-semibold tracking-wide cursor-pointer
                               hover:bg-cyan-300 hover:shadow-[0_0_25px_rgba(0,229,255,0.35)] transition-all duration-300
                               flex items-center gap-2'>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Try the Bot
            </button>
            <button className='rounded-lg border border-white/20 text-white/80 px-6 py-3 text-sm font-semibold tracking-wide cursor-pointer
                               hover:border-cyan-400/50 hover:text-cyan-400 hover:bg-cyan-400/5 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all duration-300
                               flex items-center gap-2'>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                View Dashboard
            </button>
        </div>
      
      </div>

      <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-[1]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 229, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="absolute inset-0 pointer-events-none z-[2]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)' }}
      />
    </div>
  );
}

import { useEffect, useRef } from 'react';

const FLOWERS = [
  { x: 350, y: 552, kind: 'b' as const, scale: 1, color: '#f5b800', delay: -0.4 },
  { x: 452, y: 558, kind: 'a' as const, scale: 0.8, color: '#fff3cf', delay: -1.3 },
  { x: 596, y: 550, kind: 'a' as const, scale: 0.95, color: '#ff8a6b', delay: -2.1 },
  { x: 742, y: 558, kind: 'b' as const, scale: 0.85, color: '#f5b800', delay: -0.9 },
  { x: 846, y: 552, kind: 'a' as const, scale: 0.7, color: '#c9a9ff', delay: -2.8 },
  { x: 1006, y: 556, kind: 'b' as const, scale: 0.9, color: '#ff8a6b', delay: -1.7 },
  { x: 1262, y: 552, kind: 'a' as const, scale: 0.85, color: '#fff3cf', delay: -0.6 },
  { x: 1382, y: 558, kind: 'b' as const, scale: 0.75, color: '#f5b800', delay: -2.4 },
];

const FIREFLIES = [
  { x: 300, y: 470, delay: -1 }, { x: 470, y: 500, delay: -4 },
  { x: 620, y: 455, delay: -7 }, { x: 760, y: 492, delay: -2.5 },
  { x: 890, y: 462, delay: -5.5 }, { x: 1030, y: 500, delay: -8 },
  { x: 1190, y: 470, delay: -3.2 }, { x: 1330, y: 495, delay: -6.4 },
];

/** Басты бет hero-ының тірі фоны: ағаштар, шөп, гүлдер және желбіреген ту. */
export function HeroScenery() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (!svgRef.current) return;
      if (mq.matches) svgRef.current.pauseAnimations();
      else svgRef.current.unpauseAnimations();
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const grass = Array.from({ length: 38 }, (_, i) => {
    const x = i * 38 + 8;
    const h = 0.7 + ((i * 7) % 9) * 0.06;
    const delay = -((i * 5) % 13) * 0.38;
    const dur = 3.6 + ((i * 3) % 7) * 0.28;
    return { x, h, delay, dur };
  });

  return (
    <div className="hero-scenery" aria-hidden="true">
      <svg ref={svgRef} viewBox="0 0 1440 560" preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          <linearGradient id="hs-hill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0f1f15" />
            <stop offset="1" stopColor="#050a07" />
          </linearGradient>
          <linearGradient id="hs-hill-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#142619" stopOpacity=".66" />
            <stop offset="1" stopColor="#080f0b" stopOpacity=".15" />
          </linearGradient>
          <linearGradient id="hs-leaf" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#17301f" />
            <stop offset="1" stopColor="#060d08" />
          </linearGradient>
          <linearGradient id="hs-leaf-lit" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor="#2a4c31" />
            <stop offset="1" stopColor="#0b1a10" />
          </linearGradient>
          <linearGradient id="hs-pole" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#6b5a2a" />
            <stop offset=".5" stopColor="#f0d27a" />
            <stop offset="1" stopColor="#5d4c22" />
          </linearGradient>
          <linearGradient id="hs-flag" x1="0" y1="0" x2="1" y2=".4">
            <stop offset="0" stopColor="#075a74" />
            <stop offset=".55" stopColor="#0d90ac" />
            <stop offset="1" stopColor="#075068" />
          </linearGradient>
          <radialGradient id="hs-glow">
            <stop offset="0" stopColor="#ffd34d" stopOpacity=".55" />
            <stop offset=".6" stopColor="#ffd34d" stopOpacity=".16" />
            <stop offset="1" stopColor="#ffd34d" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hs-fly">
            <stop offset="0" stopColor="#fff6c4" />
            <stop offset=".4" stopColor="#ffd34d" stopOpacity=".9" />
            <stop offset="1" stopColor="#ffd34d" stopOpacity="0" />
          </radialGradient>

          <g id="hs-blade">
            <path d="M0,0 C-5,-20 -3,-44 0,-62 C3,-44 5,-20 0,0Z" fill="#1d3a24" />
            <path d="M0,-4 C-2,-24 0,-46 0,-60" stroke="#497a4a" strokeOpacity=".35" strokeWidth="1.4" fill="none" />
          </g>

          <g id="hs-flower-a">
            <path d="M0,0 C-3,-14 -3,-28 0,-44" stroke="#315c37" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M0,-16 C-9,-18 -13,-26 -11,-32 C-3,-30 0,-24 0,-16Z" fill="#2c5232" />
            <circle cx="0" cy="-50" r="21" fill="url(#hs-glow)" />
            <g fill="currentColor" opacity=".95">
              <circle cx="-6.5" cy="-50" r="7" />
              <circle cx="6.5" cy="-50" r="7" />
              <circle cx="0" cy="-58" r="7" />
              <circle cx="-4.5" cy="-42" r="6" />
              <circle cx="4.5" cy="-42" r="6" />
            </g>
            <circle cx="0" cy="-50" r="4.2" fill="#ffe9a8" />
          </g>

          <g id="hs-flower-b">
            <path d="M0,0 C-2,-16 -2,-30 0,-46" stroke="#315c37" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M0,-14 C8,-16 13,-24 11,-30 C4,-28 0,-22 0,-14Z" fill="#2c5232" />
            <circle cx="0" cy="-52" r="20" fill="url(#hs-glow)" />
            <path d="M-8,-44 C-10,-56 -6,-64 0,-64 C6,-64 10,-56 8,-44 C4,-40 -4,-40 -8,-44Z" fill="currentColor" />
            <path d="M-3,-60 C-4,-54 -3,-49 0,-44" stroke="#ffffff" strokeOpacity=".28" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        </defs>

        {/* алыс жасыл белдеу */}
        <path d="M0,486 C210,462 370,504 610,478 C860,450 1090,500 1440,462 L1440,560 L0,560Z" fill="url(#hs-hill-back)" />
        <path d="M0,506 C240,478 420,524 690,498 C960,472 1180,520 1440,492 L1440,560 L0,560Z" fill="url(#hs-hill)" />

        {/* шеткі бұталар */}
        <g fill="#0c1811">
          <path d="M740,538 C760,512 800,508 820,538Z" />
          <path d="M1090,540 C1112,516 1152,514 1174,540Z" />
        </g>

        {/* ағаштар */}
        <g transform="translate(1350,510)">
          <path d="M-6,0 C-5,-52 -8,-94 -3,-132 L3,-132 C8,-94 5,-52 6,0Z" fill="#0d1810" />
          <g className="hs-canopy hs-sway" style={{ animationDuration: '8.4s', animationDelay: '-1.2s' }}>
            <circle cx="-30" cy="-150" r="38" fill="url(#hs-leaf)" />
            <circle cx="22" cy="-160" r="43" fill="url(#hs-leaf)" />
            <circle cx="0" cy="-192" r="35" fill="url(#hs-leaf-lit)" />
            <circle cx="-14" cy="-122" r="29" fill="url(#hs-leaf)" />
            <circle cx="28" cy="-126" r="27" fill="url(#hs-leaf)" />
            <circle cx="2" cy="-208" r="20" fill="url(#hs-leaf-lit)" />
            <circle cx="-44" cy="-168" r="19" fill="url(#hs-leaf-lit)" />
            <circle cx="44" cy="-182" r="17" fill="url(#hs-leaf)" />
            <circle cx="-24" cy="-172" r="5" fill="#c9a227" opacity=".22" />
            <circle cx="30" cy="-180" r="4" fill="#c9a227" opacity=".18" />
            <circle cx="8" cy="-224" r="3" fill="#e0b943" opacity=".2" />
          </g>
        </g>

        <g transform="translate(1248,516) scale(.7)">
          <path d="M-5,0 C-4,-46 -7,-84 -2,-118 L2,-118 C7,-84 4,-46 5,0Z" fill="#0d1810" />
          <g className="hs-canopy hs-sway" style={{ animationDuration: '7.2s', animationDelay: '-2.6s' }}>
            <circle cx="-24" cy="-136" r="34" fill="url(#hs-leaf)" />
            <circle cx="18" cy="-148" r="36" fill="url(#hs-leaf-lit)" />
            <circle cx="0" cy="-172" r="29" fill="url(#hs-leaf)" />
            <circle cx="26" cy="-116" r="23" fill="url(#hs-leaf)" />
            <circle cx="-36" cy="-152" r="17" fill="url(#hs-leaf)" />
            <circle cx="6" cy="-190" r="16" fill="url(#hs-leaf-lit)" />
            <circle cx="-18" cy="-160" r="4" fill="#c9a227" opacity=".2" />
            <circle cx="20" cy="-176" r="3" fill="#e0b943" opacity=".18" />
          </g>
        </g>

        {/* ту */}
        <g transform="translate(740,391) scale(.6)">
          <g className="hs-flag">
            <rect x="-2.5" y="-8" width="5" height="248" rx="2.5" fill="url(#hs-pole)" />
            <circle cx="0" cy="-13" r="5" fill="#f0d27a" />
            <path fill="url(#hs-flag)" d="M4,6 C44,0 84,14 124,5 C144,1 164,9 184,3 L184,75 C164,81 144,73 124,79 C84,90 44,76 4,82 Z">
              <animate
                attributeName="d"
                dur="2.8s"
                repeatCount="indefinite"
                values="M4,6 C44,0 84,14 124,5 C144,1 164,9 184,3 L184,75 C164,81 144,73 124,79 C84,90 44,76 4,82 Z;M4,10 C44,4 84,16 124,9 C144,5 164,7 184,1 L184,73 C164,79 144,75 124,81 C84,86 44,80 4,76 Z;M4,4 C44,10 84,2 124,11 C144,15 164,5 184,9 L184,81 C164,77 144,87 124,73 C84,65 44,82 4,86 Z;M4,6 C44,0 84,14 124,5 C144,1 164,9 184,3 L184,75 C164,81 144,73 124,79 C84,90 44,76 4,82 Z"
              />
            </path>
            <g transform="translate(42,44)" fill="#ffd34d">
              <circle r="12" />
              <g stroke="#ffd34d" strokeWidth="2" strokeLinecap="round">
                <line x1="0" y1="-17" x2="0" y2="-21" />
                <line x1="0" y1="17" x2="0" y2="21" />
                <line x1="-17" y1="0" x2="-21" y2="0" />
                <line x1="17" y1="0" x2="21" y2="0" />
                <line x1="-12" y1="-12" x2="-15" y2="-15" />
                <line x1="12" y1="-12" x2="15" y2="-15" />
                <line x1="-12" y1="12" x2="-15" y2="15" />
                <line x1="12" y1="12" x2="15" y2="15" />
              </g>
              <path d="M-7,18 C-3,14 0,17 0,20 C0,17 3,14 7,18 C4,21 -4,21 -7,18Z" fill="#ffd34d" opacity=".9" />
            </g>
          </g>
        </g>

        {/* шөп */}
        {grass.map((g, i) => (
          <g key={i} transform={`translate(${g.x},562) scale(${g.h})`}>
            <g className="hs-grass" style={{ animationDelay: `${g.delay}s`, animationDuration: `${g.dur}s` }}>
              <use href="#hs-blade" />
            </g>
          </g>
        ))}

        {/* гүлдер */}
        {FLOWERS.map((f, i) => (
          <g key={i} transform={`translate(${f.x},${f.y}) scale(${f.scale})`}>
            <g className="hs-flower" style={{ animationDelay: `${f.delay}s` }}>
              <g className="hs-bloom" style={{ animationDelay: `${1 + i * 0.18}s` }}>
                <use href={f.kind === 'a' ? '#hs-flower-a' : '#hs-flower-b'} color={f.color} />
              </g>
            </g>
          </g>
        ))}

        {/* отшашу-жарқырау */}
        {FIREFLIES.map((f, i) => (
          <g key={i} className="hs-fly" style={{ animationDelay: `${f.delay}s` }}>
            <circle cx={f.x} cy={f.y} r="7" fill="url(#hs-fly)" opacity=".8" />
            <circle cx={f.x} cy={f.y} r="1.6" fill="#fff6c4" />
          </g>
        ))}
      </svg>
    </div>
  );
}

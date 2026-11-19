"use client";

import React from "react";
import AdmitOneTicket from "@/components/ui/admit-one-3-d-holographic-ticket";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DemoTicketPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-14" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="dp-container max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="dp-btn-ghost mb-8" style={{ padding: '4px 0', color: 'var(--text-muted)' }}><ArrowLeft size={14} /> Back to previous page</button>
        <header className="mb-9 border-b pb-7" style={{ borderColor: 'var(--border)' }}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>Tivent / Design lab</p>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="text-4xl font-semibold tracking-tighter sm:text-5xl">Tickets with a little magic<span style={{ color: 'var(--accent)' }}>.</span></h1><p className="mt-3 max-w-2xl text-[14px] leading-6" style={{ color: 'var(--text-secondary)' }}>A collection of live holographic ticket treatments. Hover each pass to explore its depth, light and motion.</p></div><span className="dp-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>WebGL specimen / 01—04</span></div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="dp-surface p-5 lg:sticky lg:top-8">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>Collection notes</p>
            <div className="space-y-4 text-[12px] leading-5" style={{ color: 'var(--text-secondary)' }}><p>Four unique treatments, tuned for distinct event moods.</p><p>Move your pointer over a ticket to see the holographic tilt.</p><p>Each pass adapts the same collectible format to a new palette.</p></div>
            <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}><p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Interaction</p><p className="mt-1 text-[12px]">Pointer-responsive · WebGL</p></div>
          </aside>
          <div className="grid gap-5 mb-12">
          {/* Example 1: Default Purple Theme */}
          <div className="flex flex-col items-center gap-4">
            <AdmitOneTicket
              name="ALEXANDER VANCE"
              presenter="TIVENT"
              event="BLOCKCHAIN CONFERENCE"
              venue="JAKARTA CONVENTION CENTER"
              dates="DEC 15-17, 2024 • JAKARTA"
              stubText="VIP ACCESS"
              watermark="2024"
              width={640}
            />
            <div className="text-center">
              <p className="text-[13px] font-medium mb-1">Default Theme</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Purple holographic with animated shader effects
              </p>
            </div>
          </div>

          {/* Example with Background Image */}
          <div className="flex flex-col items-center gap-4">
            <AdmitOneTicket
              name="JOHN ANDERSON"
              presenter="TIVENT"
              event="WEB3 DEVELOPERS SUMMIT"
              venue="BALI INTERNATIONAL EXPO"
              dates="JAN 10-12, 2025 • BALI"
              stubText="SPEAKER PASS"
              watermark="2025"
              width={640}
              imageUrl="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
              texture={{
                colorFront: "#8b5cf6",
                shape: "warp",
                speed: 0.4
              }}
            />
            <div className="text-center">
              <p className="text-[13px] font-medium mb-1">Background Image Mode</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Event thumbnail as background with holographic overlay
              </p>
            </div>
          </div>

          {/* Example 2: Custom Colors */}
          <div className="flex flex-col items-center gap-4">
            <AdmitOneTicket
              name="SARAH JOHNSON"
              presenter="TIVENT"
              event="WEB3 SUMMIT ASIA"
              venue="BALI INTERNATIONAL EXPO"
              dates="JAN 20-22, 2025 • BALI"
              stubText="GENERAL ADMISSION"
              watermark="2025"
              width={640}
              texture={{
                engine: "generative",
                colorBack: "#0a1525",
                colorFront: "#1e90ff",
                colorHighlight: "#00d4ff",
                shape: "ripple",
                type: "4x4",
                size: 0.8,
                colorSteps: 6,
                originalColors: false,
                scale: 1.2,
                rotation: 0,
                offsetX: 0,
                offsetY: 0,
                speed: 0.3
              }}
            />
            <div className="text-center">
              <p className="text-[13px] font-medium mb-1">Blue Ripple Theme</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Custom blue gradient with ripple effect
              </p>
            </div>
          </div>

          {/* Example 3: Green Theme */}
          <div className="flex flex-col items-center gap-4">
            <AdmitOneTicket
              name="MICHAEL CHEN"
              presenter="CRYPTO FEST"
              event="NFT EXHIBITION"
              venue="SINGAPORE EXPO • HALL 5"
              dates="FEB 10-12, 2025 • SINGAPORE"
              stubText="BACKSTAGE PASS"
              watermark="2025"
              width={640}
              texture={{
                engine: "generative",
                colorBack: "#0a1510",
                colorFront: "#10b981",
                colorHighlight: "#34d399",
                shape: "wave",
                type: "random",
                size: 1.2,
                colorSteps: 5,
                originalColors: false,
                scale: 0.9,
                rotation: 0,
                offsetX: 0,
                offsetY: 0,
                speed: 0.5
              }}
            />
            <div className="text-center">
              <p className="text-[13px] font-medium mb-1">Green Wave Theme</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Emerald green with wave pattern
              </p>
            </div>
          </div>

          {/* Example 4: Gradient Image Mode */}
          <div className="flex flex-col items-center gap-4">
            <AdmitOneTicket
              name="EMMA RODRIGUEZ"
              presenter="TECH INNOVATION"
              event="STARTUP SHOWCASE"
              venue="MANILA CONVENTION CENTER"
              dates="MAR 5-7, 2025 • MANILA"
              stubText="EXHIBITOR"
              watermark="2025"
              width={640}
              texture={{
                engine: "image",
                colorBack: "#0a0515",
                colorFront: "#ff6b6b",
                colorHighlight: "#ffa07a",
                type: "8x8",
                size: 1.5,
                colorSteps: 8,
                originalColors: false,
                scale: 1,
                rotation: 0,
                offsetX: 0,
                offsetY: 0,
                speed: 0.2
              }}
              gradient={{
                centreX: 0.5,
                centreY: 0.4,
                radius: 0.7,
                midStop: 0.5,
                colorLight: "#ff6b6b",
                colorMid: "#ff8e53",
                colorDark: "#ff4757"
              }}
            />
            <div className="text-center">
              <p className="text-[13px] font-medium mb-1">Red Gradient Theme</p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Image-based gradient with dithering
              </p>
            </div>
          </div>

        {/* Usage Info */}
        <div className="dp-surface p-5 sm:p-7">
          <h2 className="text-[18px] font-semibold mb-4">Integration Notes</h2>
          <ul className="space-y-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--accent)' }}>•</span>
              <span>Component uses WebGL2 for shader-based holographic effects</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--accent)' }}>•</span>
              <span>Responsive to `prefers-reduced-motion` for accessibility</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--accent)' }}>•</span>
              <span>Supports custom textures, colors, and animation speeds</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--accent)' }}>•</span>
              <span>No external dependencies needed - all styles inline</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--accent)' }}>•</span>
              <span>Can be disabled by setting `tilt={"{"}false{"}"}`</span>
            </li>
          </ul>
        </div>
          </div>
        </div>
      </div>
    </main>
  );
}

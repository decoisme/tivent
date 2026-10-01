"use client";

import React from "react";
import AdmitOneTicket from "@/components/ui/admit-one-3-d-holographic-ticket";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DemoTicketPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen py-24 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="dp-container max-w-4xl">
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="dp-btn-ghost mb-8" 
          style={{ padding: '4px 0', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="text-center mb-12">
          <h1 className="text-[32px] font-semibold tracking-[-0.02em] mb-3">
            3D Holographic Ticket
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Move your cursor over the ticket to experience dynamic 3D tilt and holographic effects
          </p>
        </div>

        {/* Demo Tickets Grid */}
        <div className="grid gap-12 mb-12">
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
        </div>

        {/* Usage Info */}
        <div className="dp-surface p-6 max-w-2xl mx-auto">
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
  );
}

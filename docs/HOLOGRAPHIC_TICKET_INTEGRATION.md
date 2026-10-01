# 3D Holographic Ticket Integration Guide

## Overview
The 3D Holographic Ticket component provides a premium, interactive ticket visualization with WebGL2-powered shader effects, 3D tilt interaction, and holographic animations.

## Features
- ✅ 3D tilt effect on mouse/pointer movement
- ✅ WebGL2 shader-based holographic textures
- ✅ Animated dithering patterns (simplex, warp, dots, wave, ripple, swirl, sphere)
- ✅ Gradient image mode with color mapping
- ✅ Respects `prefers-reduced-motion` for accessibility
- ✅ Fully customizable colors, shapes, and animations
- ✅ No external asset dependencies

## Installation
Component is already installed at:
```
src/components/ui/admit-one-3-d-holographic-ticket.tsx
```

No additional npm packages needed - everything is self-contained.

## Basic Usage

```tsx
import AdmitOneTicket from "@/components/ui/admit-one-3-d-holographic-ticket";

<AdmitOneTicket
  name="JOHN DOE"
  presenter="DECENTRAPASS"
  event="WEB3 CONFERENCE"
  venue="JAKARTA CONVENTION CENTER"
  dates="DEC 15-17, 2024 • JAKARTA"
  stubText="VIP ACCESS"
  watermark="2024"
  width={640}
/>
```

## Integration with Event Data

### Example: My Tickets Page

```tsx
'use client';

import { useUserTickets } from '@/hooks/useUserTickets';
import AdmitOneTicket from '@/components/ui/admit-one-3-d-holographic-ticket';

export default function MyTicketsWithHolographic() {
  const { tickets } = useUserTickets();

  return (
    <div className="grid gap-8">
      {tickets.map((ticket) => (
        <AdmitOneTicket
          key={ticket.tokenId}
          name={ticket.owner} // Or user's name from metadata
          presenter="DECENTRAPASS"
          event={ticket.eventTitle || `Event #${ticket.eventId}`}
          venue={ticket.eventVenue || "TBD"}
          dates={formatEventDate(ticket.eventDate)}
          stubText={`TICKET #${ticket.tokenId}`}
          watermark={new Date(ticket.eventDate).getFullYear().toString()}
          width={640}
        />
      ))}
    </div>
  );
}
```

### Example: Ticket Detail Page

```tsx
// src/app/tickets/[id]/page.tsx
import AdmitOneTicket from '@/components/ui/admit-one-3-d-holographic-ticket';

export default function TicketDetailPage({ params }) {
  const { ticket, event } = useTicketData(params.id);

  return (
    <div className="flex flex-col items-center">
      <AdmitOneTicket
        name={ticket.owner}
        presenter="DECENTRAPASS"
        event={event.metadata?.title || 'Event'}
        venue={event.metadata?.venue || 'TBD'}
        dates={formatDateRange(event.metadata?.startDate, event.metadata?.endDate)}
        stubText={ticket.active ? "ACTIVE" : "USED"}
        watermark={ticket.tokenId.toString()}
        width={740}
        texture={{
          colorBack: ticket.redeemed ? "#1a1a1a" : "#0a0515",
          colorFront: ticket.redeemed ? "#666666" : "#5b21b6",
          colorHighlight: ticket.redeemed ? "#999999" : "#7c3aed",
          shape: "warp",
          speed: ticket.redeemed ? 0 : 0.4
        }}
      />
    </div>
  );
}
```

## Props Reference

### Required Props
| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Attendee name (auto-splits to max 3 lines) |
| `presenter` | `string` | Event organizer/presenter |
| `event` | `string` | Event name |
| `venue` | `string` | Venue location |
| `dates` | `string` | Event dates |
| `stubText` | `string` | Text on ticket stub (vertical) |
| `watermark` | `string` | Large watermark text (vertical) |

### Optional Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `741` | Ticket width in pixels |
| `tilt` | `object \| false` | `{}` | Tilt settings or disable with `false` |
| `className` | `string` | `""` | Additional CSS classes |

### Tilt Options
```tsx
tilt={{
  maxTilt: 9,    // Max rotation in degrees
  scale: 1.02,   // Hover scale multiplier
  glare: 0.16    // Holographic glare intensity (0-1)
}}

// Or disable tilt entirely:
tilt={false}
```

### Texture Configuration

#### Generative Mode (Default)
```tsx
texture={{
  engine: "generative",
  colorBack: "#0a0515",        // Background color
  colorFront: "#5b21b6",       // Primary dithering color
  colorHighlight: "#7c3aed",   // Highlight/accent color
  shape: "warp",               // simplex|warp|dots|wave|ripple|swirl|sphere
  type: "random",              // random|2x2|4x4|8x8 (dithering pattern)
  size: 0.5,                   // Pixel size for dithering
  colorSteps: 4,               // Number of color quantization steps
  originalColors: false,       // Use source colors vs custom palette
  scale: 1,                    // Pattern scale
  rotation: 0,                 // Rotation in degrees
  offsetX: 0,                  // X offset
  offsetY: 0,                  // Y offset
  speed: 0.4                   // Animation speed (0 = static)
}}
```

#### Image/Gradient Mode
```tsx
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
  centreX: 0.5,         // Gradient center X (0-1)
  centreY: 0.4,         // Gradient center Y (0-1)
  radius: 0.7,          // Gradient radius (0-1)
  midStop: 0.5,         // Mid color stop position (0-1)
  colorLight: "#ff6b6b",
  colorMid: "#ff8e53",
  colorDark: "#ff4757"
}}
```

### Geometry Customization
```tsx
geometry={{
  aspect: 741 / 425,    // Width/height ratio
  cornerRadius: 0.034,  // Corner roundness (0-1)
  notchRadius: 0.028,   // Perforation notch radius
  perforation: 0.758    // Stub position (0-1)
}}
```

### Layout Customization
```tsx
layout={{
  padding: 0.077,          // Edge padding
  labelTop: 0.078,         // Top label position
  labelSize: 0.020,        // Label font size
  nameTop: 0.250,          // Name position
  nameSize: 0.087,         // Name font size
  footerTop: 0.480,        // Footer position
  footerSize: 0.017,       // Footer font size
  stubSize: 0.091,         // Stub text size
  watermarkSize: 0.194,    // Watermark size
  watermarkOpacity: 0.1,   // Watermark visibility (0-1)
  inkColor: "#f8f8f8"      // Text color
}}
```

## Theme Presets

### Purple Holographic (Default)
```tsx
<AdmitOneTicket {...props} />
```

### Blue Ocean
```tsx
<AdmitOneTicket
  {...props}
  texture={{
    engine: "generative",
    colorBack: "#0a1525",
    colorFront: "#1e90ff",
    colorHighlight: "#00d4ff",
    shape: "ripple",
    speed: 0.3
  }}
/>
```

### Green Matrix
```tsx
<AdmitOneTicket
  {...props}
  texture={{
    engine: "generative",
    colorBack: "#0a1510",
    colorFront: "#10b981",
    colorHighlight: "#34d399",
    shape: "wave",
    speed: 0.5
  }}
/>
```

### Red Gradient
```tsx
<AdmitOneTicket
  {...props}
  texture={{
    engine: "image",
    colorBack: "#0a0515",
    colorFront: "#ff6b6b",
    colorHighlight: "#ffa07a",
    speed: 0.2
  }}
  gradient={{
    colorLight: "#ff6b6b",
    colorMid: "#ff8e53",
    colorDark: "#ff4757"
  }}
/>
```

### Grayscale (For Redeemed Tickets)
```tsx
<AdmitOneTicket
  {...props}
  texture={{
    engine: "generative",
    colorBack: "#1a1a1a",
    colorFront: "#666666",
    colorHighlight: "#999999",
    shape: "dots",
    speed: 0
  }}
/>
```

## Responsive Design

```tsx
// Mobile
<AdmitOneTicket {...props} width={340} />

// Tablet
<AdmitOneTicket {...props} width={540} />

// Desktop
<AdmitOneTicket {...props} width={740} />
```

## Performance Considerations

1. **WebGL2 Required**: Component needs WebGL2 support (check with fallback)
2. **Rendering**: One canvas per ticket - limit visible tickets on screen
3. **Animation**: Set `speed={0}` for static tickets to save CPU/GPU
4. **Reduced Motion**: Automatically respects user's motion preferences

### Browser Compatibility Check
```tsx
function TicketWithFallback(props) {
  const [hasWebGL2, setHasWebGL2] = useState(true);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      setHasWebGL2(false);
    }
  }, []);

  if (!hasWebGL2) {
    return <StaticTicketCard {...props} />;
  }

  return <AdmitOneTicket {...props} />;
}
```

## Accessibility

- Component respects `prefers-reduced-motion`
- Tilt effects disabled for motion-sensitive users
- Animation speed reduced to 0 automatically
- Use semantic HTML around component for screen readers:

```tsx
<article aria-label="Event Ticket">
  <AdmitOneTicket {...props} />
  <div className="sr-only">
    Ticket for {event} at {venue} on {dates}
  </div>
</article>
```

## Demo Page

Visit `/demo-ticket` to see all variations and themes.

## Troubleshooting

### WebGL Error
**Problem**: "WebGL is not supported in this browser"
**Solution**: Add browser compatibility check and fallback UI

### Performance Issues
**Problem**: Page lags with many tickets
**Solution**: 
- Use virtualization for long lists
- Set `speed={0}` for off-screen tickets
- Reduce `width` for mobile

### Tilt Not Working
**Problem**: 3D tilt effect not responding
**Solution**:
- Check `tilt={false}` is not set
- Verify pointer events are not blocked
- Check `prefers-reduced-motion` setting

## Future Enhancements

- [ ] QR code overlay integration
- [ ] Print-optimized mode
- [ ] AR/VR viewing mode
- [ ] NFT metadata integration
- [ ] Animated ticket reveals
- [ ] Custom shape support

## Support

For issues or questions:
- Check `/demo-ticket` for working examples
- Review shader console errors for WebGL issues
- Test in Chrome/Firefox/Safari for compatibility

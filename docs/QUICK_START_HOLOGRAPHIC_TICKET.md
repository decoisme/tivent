# Quick Start: 3D Holographic Ticket

## ✅ Installation Complete

The 3D Holographic Ticket component has been successfully integrated into DecentraPass!

## 📁 Files Added

```
src/components/ui/admit-one-3-d-holographic-ticket.tsx  ← Main component
src/app/demo-ticket/page.tsx                            ← Demo page
docs/HOLOGRAPHIC_TICKET_INTEGRATION.md                  ← Full documentation
docs/QUICK_START_HOLOGRAPHIC_TICKET.md                  ← This file
```

## 🎫 View Demo

Start the dev server and visit:
```bash
npm run dev
# Navigate to: http://localhost:3000/demo-ticket
```

## 🚀 Quick Usage

### 1. Basic Implementation

```tsx
import AdmitOneTicket from "@/components/ui/admit-one-3-d-holographic-ticket";

<AdmitOneTicket
  name="YOUR NAME"
  presenter="DECENTRAPASS"
  event="YOUR EVENT NAME"
  venue="VENUE LOCATION"
  dates="DATE RANGE"
  stubText="TICKET TYPE"
  watermark="YEAR"
  width={640}
/>
```

### 2. With Your Event Data

```tsx
import AdmitOneTicket from "@/components/ui/admit-one-3-d-holographic-ticket";

function EventTicket({ ticket, event }) {
  return (
    <AdmitOneTicket
      name={ticket.owner}
      presenter="DECENTRAPASS"
      event={event.metadata?.title || 'Event'}
      venue={event.metadata?.venue || 'TBD'}
      dates={formatDate(event.metadata?.startDate)}
      stubText={`TICKET #${ticket.tokenId}`}
      watermark={new Date().getFullYear().toString()}
      width={640}
    />
  );
}
```

### 3. Custom Theme

```tsx
<AdmitOneTicket
  name="JANE DOE"
  presenter="DECENTRAPASS"
  event="BLOCKCHAIN SUMMIT"
  venue="JAKARTA"
  dates="DEC 2024"
  stubText="VIP"
  watermark="2024"
  width={640}
  texture={{
    colorBack: "#0a1525",
    colorFront: "#1e90ff",
    colorHighlight: "#00d4ff",
    shape: "ripple",
    speed: 0.3
  }}
/>
```

### 4. Disable Tilt for Static Display

```tsx
<AdmitOneTicket
  {...props}
  tilt={false}
/>
```

## 🎨 Available Shapes

- `simplex` - Organic noise pattern
- `warp` - Flowing liquid effect
- `dots` - Dotted pattern (default)
- `wave` - Wave animation
- `ripple` - Circular ripples
- `swirl` - Spiral pattern
- `sphere` - 3D sphere shading

## 🎯 Where to Use It

### Suggested Integration Points:

1. **My Tickets Page** (`/tickets`)
   - Show holographic ticket for each owned ticket
   - Different colors for active vs redeemed

2. **Ticket Detail** (`/tickets/[id]`)
   - Large holographic display
   - QR code overlay option

3. **Purchase Success** (`/events/[id]/purchase`)
   - Animated ticket reveal after purchase

4. **Resale Listing** (`/resale/[id]`)
   - Premium ticket preview

5. **Marketing/Landing** (`/`)
   - Hero section with rotating demo ticket

## 🔧 Customization Tips

### Theme Based on Ticket Status

```tsx
const getTicketTheme = (ticket) => {
  if (ticket.redeemed) {
    return {
      colorBack: "#1a1a1a",
      colorFront: "#666666",
      colorHighlight: "#999999",
      speed: 0 // Static for used tickets
    };
  }
  
  if (ticket.active) {
    return {
      colorBack: "#0a0515",
      colorFront: "#5b21b6",
      colorHighlight: "#7c3aed",
      speed: 0.4 // Animated for active
    };
  }
  
  // Expired
  return {
    colorBack: "#150a0a",
    colorFront: "#dc2626",
    colorHighlight: "#ef4444",
    speed: 0.2
  };
};

<AdmitOneTicket
  {...props}
  texture={getTicketTheme(ticket)}
/>
```

### Responsive Sizing

```tsx
function ResponsiveTicket(props) {
  const [width, setWidth] = useState(640);
  
  useEffect(() => {
    const updateWidth = () => {
      if (window.innerWidth < 640) setWidth(320);
      else if (window.innerWidth < 1024) setWidth(540);
      else setWidth(740);
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  return <AdmitOneTicket {...props} width={width} />;
}
```

## ⚠️ Important Notes

1. **Browser Compatibility**: Requires WebGL2 support
   - ✅ Chrome 56+
   - ✅ Firefox 51+
   - ✅ Safari 15+
   - ✅ Edge 79+

2. **Performance**: 
   - Limit to 5-10 visible tickets at once
   - Use `speed={0}` for off-screen tickets
   - Consider virtualization for long lists

3. **Accessibility**:
   - Automatically respects `prefers-reduced-motion`
   - Animations pause when user has motion sensitivity enabled

## 📖 Next Steps

1. ✅ Build successful - component ready to use
2. 🎯 Visit `/demo-ticket` to see examples
3. 📚 Read full docs: `docs/HOLOGRAPHIC_TICKET_INTEGRATION.md`
4. 🎨 Customize for your event themes
5. 🚀 Integrate into your pages

## 🆘 Need Help?

- **Demo not working?** Make sure dev server is running (`npm run dev`)
- **WebGL errors?** Check browser compatibility
- **Performance issues?** Reduce number of visible tickets or set `speed={0}`
- **Customization?** See full documentation in `HOLOGRAPHIC_TICKET_INTEGRATION.md`

---

**Component Status**: ✅ Installed and Build-Ready
**Demo Page**: `/demo-ticket`
**Production Ready**: Yes (tested build successful)

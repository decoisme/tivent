'use client';

export function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-[3px] border-current border-t-transparent"
      style={{
        width: size,
        height: size,
        color: 'var(--accent)',
      }}
    />
  );
}

export function PageLoadingSpinner() {
  return (
    <div 
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ 
        backgroundColor: 'var(--bg)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="text-center">
        <LoadingSpinner size={48} />
        <p className="mt-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Loading...
        </p>
      </div>
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ 
          backgroundColor: 'var(--accent)',
          animationDelay: '0ms',
          animationDuration: '1s',
        }}
      />
      <div
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ 
          backgroundColor: 'var(--accent)',
          animationDelay: '150ms',
          animationDuration: '1s',
        }}
      />
      <div
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ 
          backgroundColor: 'var(--accent)',
          animationDelay: '300ms',
          animationDuration: '1s',
        }}
      />
    </div>
  );
}

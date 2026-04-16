import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number; // Depth for parallax
  size: number;
}

const NodeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const nodesRef = useRef<Node[]>([]);
  const requestRef = useRef<number>();

  const initNodes = (width: number, height: number) => {
    const nodes: Node[] = [];
    const count = Math.min(Math.floor((width * height) / 15000), 100);
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        z: Math.random() * 2 + 1, // Depth factor
        size: Math.random() * 2 + 1,
      });
    }
    nodesRef.current = nodes;
  };

  const draw = (ctx: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    const { width, height } = ctx;
    context.clearRect(0, 0, width, height);

    // Get colors from CSS variables
    const nodeColor = getComputedStyle(document.documentElement).getPropertyValue('--node-color').trim();
    const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim();

    const nodes = nodesRef.current;
    const mouse = mouseRef.current;

    context.fillStyle = nodeColor;
    context.strokeStyle = lineColor;
    context.lineWidth = 1;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      
      // Update position with drift and parallax
      // We don't modify n.x/n.y directly with mouse to keep the drift stable
      const parallaxX = (mouse.x - width / 2) * (n.z * 0.02);
      const parallaxY = (mouse.y - height / 2) * (n.z * 0.02);

      const renderX = (n.x + parallaxX + width) % width;
      const renderY = (n.y + parallaxY + height) % height;

      // Update base coordinates for drift
      n.x += n.vx;
      n.y += n.vy;

      // Draw node
      context.beginPath();
      context.arc(renderX, renderY, n.size, 0, Math.PI * 2);
      context.fill();

      // Draw lines (trees)
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        const mParallaxX = (mouse.x - width / 2) * (m.z * 0.02);
        const mParallaxY = (mouse.y - height / 2) * (m.z * 0.02);
        const mRenderX = (m.x + mParallaxX + width) % width;
        const mRenderY = (m.y + mParallaxY + height) % height;

        const dx = renderX - mRenderX;
        const dy = renderY - mRenderY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          context.globalAlpha = 1 - distance / 150;
          context.beginPath();
          context.moveTo(renderX, renderY);
          context.lineTo(mRenderX, mRenderY);
          context.stroke();
          context.globalAlpha = 1.0;
        }
      }
    }

    requestRef.current = requestAnimationFrame(() => draw(ctx, context));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes(canvas.width, canvas.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    handleResize();

    requestRef.current = requestAnimationFrame(() => draw(canvas, context));

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-60"
    />
  );
};

export default NodeBackground;

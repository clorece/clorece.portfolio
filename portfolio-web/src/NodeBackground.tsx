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
  const mouseRef = useRef({ x: -1000, y: -1000 }); // Start far away
  const nodesRef = useRef<Node[]>([]);
  const requestRef = useRef<number>();

  const RADIUS = 300; // Increased visibility radius around mouse

  const initNodes = (width: number, height: number) => {
    const nodes: Node[] = [];
    const count = 250; // Increased count for higher density
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        z: Math.random() * 2 + 1,
        size: Math.random() * 2.5 + 2, // Thicker dots
      });
    }
    nodesRef.current = nodes;
  };

  const draw = (ctx: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    const { width, height } = ctx;
    context.clearRect(0, 0, width, height);

    // Get colors from CSS variables
    const nodeColorRaw = getComputedStyle(document.documentElement).getPropertyValue('--node-color').trim();
    const lineColorRaw = getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim();

    const nodes = nodesRef.current;
    const mouse = mouseRef.current;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      
      // Calculate parallax based on mouse
      const parallaxX = (mouse.x - width / 2) * (n.z * 0.012);
      const parallaxY = (mouse.y - height / 2) * (n.z * 0.012);

      const renderX = (n.x + parallaxX + width) % width;
      const renderY = (n.y + parallaxY + height) % height;

      // Distance to mouse for radius effect
      const dxMouse = renderX - mouse.x;
      const dyMouse = renderY - mouse.y;
      const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

      // Visibility factor based on radius
      let visibility = 0;
      if (distMouse < RADIUS) {
        visibility = 1 - (distMouse / RADIUS);
      }

      if (visibility > 0) {
        // Update base coordinates for drift
        n.x += n.vx;
        n.y += n.vy;

        // Draw node with fading
        context.globalAlpha = visibility;
        context.fillStyle = nodeColorRaw;
        context.beginPath();
        context.arc(renderX, renderY, n.size, 0, Math.PI * 2);
        context.fill();

        // Draw lines (trees) to nearby visible nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const mParallaxX = (mouse.x - width / 2) * (m.z * 0.012);
          const mParallaxY = (mouse.y - height / 2) * (m.z * 0.012);
          const mRenderX = (m.x + mParallaxX + width) % width;
          const mRenderY = (m.y + mParallaxY + height) % height;

          const dx = renderX - mRenderX;
          const dy = renderY - mRenderY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Only draw connection if both nodes are somewhat near mouse and each other
          if (distance < 150) {
            const mDxMouse = mRenderX - mouse.x;
            const mDyMouse = mRenderY - mouse.y;
            const mDistMouse = Math.sqrt(mDxMouse * mDxMouse + mDyMouse * mDyMouse);
            
            let mVisibility = 0;
            if (mDistMouse < RADIUS) {
              mVisibility = 1 - (mDistMouse / RADIUS);
            }

            const combinedVisibility = Math.min(visibility, mVisibility) * (1 - distance / 150);
            
            if (combinedVisibility > 0) {
              context.globalAlpha = combinedVisibility;
              context.strokeStyle = lineColorRaw;
              context.lineWidth = 2; // Thicker lines
              context.beginPath();
              context.moveTo(renderX, renderY);
              context.lineTo(mRenderX, mRenderY);
              context.stroke();
            }
          }
        }
      } else {
         // Still update drift even if invisible
         n.x += n.vx;
         n.y += n.vy;
      }
    }
    context.globalAlpha = 1.0;

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
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
};

export default NodeBackground;

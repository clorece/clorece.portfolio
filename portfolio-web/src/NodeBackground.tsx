import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number; // Depth for parallax
  baseSize: number;
  colorMix: number; // Random value between 0 and 1 for color interpolation
}

const NodeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const nodesRef = useRef<Node[]>([]);
  const requestRef = useRef<number>();

  const RADIUS = 350; 
  const BASE_OPACITY = 0.35;
  const ENHANCED_OPACITY = 0.9;
  const BASE_LINE_WIDTH = 1.2;
  const ENHANCED_LINE_WIDTH = 3.0;
  const MAX_CONNECT_DISTANCE = 280; // Increased to allow farther connections

  const initNodes = (width: number, height: number) => {
    const nodes: Node[] = [];
    const count = 220; // Slightly tuned for performance with larger connection range
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        z: Math.random() * 2 + 1,
        baseSize: Math.random() * 1.8 + 1.5,
        colorMix: Math.random(),
      });
    }
    nodesRef.current = nodes;
  };

  const saturateRGB = (r: number, g: number, b: number, factor: number = 1.2) => {
    const avg = (r + g + b) / 3;
    return [
      Math.min(255, Math.max(0, Math.round(avg + (r - avg) * factor))),
      Math.min(255, Math.max(0, Math.round(avg + (g - avg) * factor))),
      Math.min(255, Math.max(0, Math.round(avg + (b - avg) * factor)))
    ];
  };

  const getInterpolatedColor = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, mix: number, alpha: number) => {
    const r = Math.round(r1 + (r2 - r1) * mix);
    const g = Math.round(g1 + (g2 - g1) * mix);
    const b = Math.round(b1 + (b2 - b1) * mix);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const draw = (ctx: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    const { width, height } = ctx;
    context.clearRect(0, 0, width, height);

    const style = getComputedStyle(document.documentElement);
    let pRGB = style.getPropertyValue('--accent-primary-rgb').split(',').map(Number);
    let sRGB = style.getPropertyValue('--accent-secondary-rgb').split(',').map(Number);

    pRGB = saturateRGB(pRGB[0], pRGB[1], pRGB[2], 1.4);
    sRGB = saturateRGB(sRGB[0], sRGB[1], sRGB[2], 1.4);

    const nodes = nodesRef.current;
    const mouse = mouseRef.current;

    const renderedNodes = nodes.map(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0) n.x = width;
      if (n.x > width) n.x = 0;
      if (n.y < 0) n.y = height;
      if (n.y > height) n.y = 0;

      const parallaxX = (mouse.x - width / 2) * (n.z * 0.01);
      const parallaxY = (mouse.y - height / 2) * (n.z * 0.01);

      return {
        rx: (n.x + parallaxX + width) % width,
        ry: (n.y + parallaxY + height) % height,
        n: n
      };
    });

    for (let i = 0; i < renderedNodes.length; i++) {
      const nodeI = renderedNodes[i];
      const dxMouse = nodeI.rx - mouse.x;
      const dyMouse = nodeI.ry - mouse.y;
      const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
      const factor = Math.max(0, 1 - distMouse / RADIUS);
      
      const opacity = BASE_OPACITY + (ENHANCED_OPACITY - BASE_OPACITY) * factor;
      const size = nodeI.n.baseSize * (1 + factor * 0.5);

      const color = getInterpolatedColor(pRGB[0], pRGB[1], pRGB[2], sRGB[0], sRGB[1], sRGB[2], nodeI.n.colorMix, opacity);
      
      context.fillStyle = color;
      
      if (factor > 0.5) {
        context.shadowBlur = 10 * factor;
        context.shadowColor = color;
      } else {
        context.shadowBlur = 0;
      }

      context.beginPath();
      context.arc(nodeI.rx, nodeI.ry, size, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;

      for (let j = i + 1; j < renderedNodes.length; j++) {
        const nodeJ = renderedNodes[j];
        const dx = nodeI.rx - nodeJ.rx;
        const dy = nodeI.ry - nodeJ.ry;
        const distSq = dx * dx + dy * dy;
        
        if (distSq < MAX_CONNECT_DISTANCE * MAX_CONNECT_DISTANCE) {
          const distActual = Math.sqrt(distSq);
          
          const mDxMouse = nodeJ.rx - mouse.x;
          const mDyMouse = nodeJ.ry - mouse.y;
          const mDistMouse = Math.sqrt(mDxMouse * mDxMouse + mDyMouse * mDyMouse);
          
          const mFactor = Math.max(0, 1 - mDistMouse / RADIUS);
          const avgFactor = (factor + mFactor) / 2;
          const avgColorMix = (nodeI.n.colorMix + nodeJ.n.colorMix) / 2;
          
          const lineOpacityBase = (BASE_OPACITY * 0.5) + (ENHANCED_OPACITY * 0.6 - BASE_OPACITY * 0.5) * avgFactor;
          const lineWidth = BASE_LINE_WIDTH + (ENHANCED_LINE_WIDTH - BASE_LINE_WIDTH) * avgFactor;

          const distanceFade = 1 - (distActual / MAX_CONNECT_DISTANCE);
          const finalOpacity = lineOpacityBase * distanceFade;

          if (finalOpacity > 0.01) {
            context.strokeStyle = getInterpolatedColor(pRGB[0], pRGB[1], pRGB[2], sRGB[0], sRGB[1], sRGB[2], avgColorMix, finalOpacity);
            context.lineWidth = lineWidth;
            context.beginPath();
            context.moveTo(nodeI.rx, nodeI.ry);
            context.lineTo(nodeJ.rx, nodeJ.ry);
            context.stroke();
          }
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
      className="fixed inset-0 z-0 pointer-events-none hidden md:block"
    />
  );
};

export default NodeBackground;

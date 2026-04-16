import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number; // Depth for parallax
  baseSize: number;
}

const NodeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 }); // Start far away
  const nodesRef = useRef<Node[]>([]);
  const requestRef = useRef<number>();

  const RADIUS = 350; // Visibility radius around mouse
  const BASE_OPACITY = 0.15;
  const ENHANCED_OPACITY = 0.6;
  const BASE_LINE_WIDTH = 0.8;
  const ENHANCED_LINE_WIDTH = 2.2;
  const MAX_CONNECT_DISTANCE = 300; // Increased to allow long-distance connectivity

  const initNodes = (width: number, height: number) => {
    const nodes: Node[] = [];
    const count = 180; // Slightly reduced for better performance with N-NN approach
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        z: Math.random() * 2 + 1,
        baseSize: Math.random() * 1.5 + 1.2,
      });
    }
    nodesRef.current = nodes;
  };

  const draw = (ctx: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
    const { width, height } = ctx;
    context.clearRect(0, 0, width, height);

    const nodeColorRaw = getComputedStyle(document.documentElement).getPropertyValue('--node-color').trim();
    const lineColorRaw = getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim();

    const nodes = nodesRef.current;
    const mouse = mouseRef.current;

    // First, update all node positions and calculate render coordinates
    const renderedNodes = nodes.map(n => {
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0) n.x = width;
      if (n.x > width) n.x = 0;
      if (n.y < 0) n.y = height;
      if (n.y > height) n.y = 0;

      const parallaxX = (mouse.x - width / 2) * (n.z * 0.012);
      const parallaxY = (mouse.y - height / 2) * (n.z * 0.012);

      return {
        rx: (n.x + parallaxX + width) % width,
        ry: (n.y + parallaxY + height) % height,
        n: n
      };
    });

    // Draw nodes and their connections
    for (let i = 0; i < renderedNodes.length; i++) {
      const nodeI = renderedNodes[i];
      const dxMouse = nodeI.rx - mouse.x;
      const dyMouse = nodeI.ry - mouse.y;
      const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
      const factor = Math.max(0, 1 - distMouse / RADIUS);
      
      const opacity = BASE_OPACITY + (ENHANCED_OPACITY - BASE_OPACITY) * factor;
      const size = nodeI.n.baseSize * (1 + factor);

      context.globalAlpha = opacity;
      context.fillStyle = nodeColorRaw;
      context.beginPath();
      context.arc(nodeI.rx, nodeI.ry, size, 0, Math.PI * 2);
      context.fill();

      // "All nodes connected" logic:
      // Find the nearest neighbors for each node to ensure no isolated groups.
      // We'll calculate distances to all other nodes and take the top 3 nearest.
      const distances = [];
      for (let j = 0; j < renderedNodes.length; j++) {
        if (i === j) continue;
        const nodeJ = renderedNodes[j];
        const dx = nodeI.rx - nodeJ.rx;
        const dy = nodeI.ry - nodeJ.ry;
        const dist = dx * dx + dy * dy; // Squared distance for performance
        distances.push({ index: j, dist: dist });
      }

      // Sort by distance and take nearest 3
      distances.sort((a, b) => a.dist - b.dist);
      const nearest = distances.slice(0, 3);

      for (const neighbor of nearest) {
        // Optimization: Only draw if i < neighbor.index to avoid double drawing
        if (i > neighbor.index) continue;

        const nodeJ = renderedNodes[neighbor.index];
        const distActual = Math.sqrt(neighbor.dist);
        
        if (distActual < MAX_CONNECT_DISTANCE) {
          const mDxMouse = nodeJ.rx - mouse.x;
          const mDyMouse = nodeJ.ry - mouse.y;
          const mDistMouse = Math.sqrt(mDxMouse * mDxMouse + mDyMouse * mDyMouse);
          
          const mFactor = Math.max(0, 1 - mDistMouse / RADIUS);
          const avgFactor = (factor + mFactor) / 2;
          
          const lineOpacity = (BASE_OPACITY * 0.4) + (ENHANCED_OPACITY * 0.5 - BASE_OPACITY * 0.4) * avgFactor;
          const lineWidth = BASE_LINE_WIDTH + (ENHANCED_LINE_WIDTH - BASE_LINE_WIDTH) * avgFactor;

          // Fade line out as it reaches the MAX_CONNECT_DISTANCE
          const distanceFade = 1 - (distActual / MAX_CONNECT_DISTANCE);
          context.globalAlpha = lineOpacity * distanceFade;
          context.strokeStyle = lineColorRaw;
          context.lineWidth = lineWidth;
          context.beginPath();
          context.moveTo(nodeI.rx, nodeI.ry);
          context.lineTo(nodeJ.rx, nodeJ.ry);
          context.stroke();
        }
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
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
};

export default NodeBackground;

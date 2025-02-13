import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function ConversationStateMatrix() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Matrix dimensions
    const width = 320;
    const height = 160;
    const dotSize = 4;
    const dotSpacing = 8;
    const rows = 15;
    const cols = 40;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Generate dot positions
    const dots = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        dots.push({
          x: j * dotSpacing + dotSpacing,
          y: i * dotSpacing + dotSpacing,
          active: Math.random() > 0.7, // Random activity for demo
        });
      }
    }

    // Create dots
    svg.selectAll('circle')
      .data(dots)
      .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', dotSize / 2)
      .attr('fill', '#3B82F6') // Blue color
      .attr('opacity', d => d.active ? 1 : 0.2)
      .attr('class', d => d.active ? 'dot-active' : '');

    // Add hover effect
    svg.selectAll('circle')
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', dotSize)
          .attr('opacity', 1);
      })
      .on('mouseout', function(event, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', dotSize / 2)
          .attr('opacity', d.active ? 1 : 0.2);
      });

    // Add animation
    function animateDots() {
      svg.selectAll('circle')
        .data(dots.map(d => ({ ...d, active: Math.random() > 0.7 })))
        .transition()
        .duration(1000)
        .attr('opacity', d => d.active ? 1 : 0.2)
        .attr('class', d => d.active ? 'dot-active' : '');
    }

    // Run animation every 3 seconds
    const interval = setInterval(animateDots, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-40 bg-white rounded-lg overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
} 
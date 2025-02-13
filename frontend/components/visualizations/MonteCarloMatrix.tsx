import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

type DotState = 'success' | 'warning' | 'error' | 'neutral';

interface Dot {
  x: number;
  y: number;
  state: DotState;
}

interface Props {
  data?: Dot[];
}

export default function MonteCarloMatrix({ data }: Props) {
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

    // State colors
    const stateColors = {
      success: '#22C55E', // Green
      warning: '#F59E0B', // Yellow
      error: '#EF4444',   // Red
      neutral: '#E5E7EB', // Gray
    };

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Generate dot positions with states if no data provided
    const dots = data || Array.from({ length: rows * cols }, (_, i) => {
      const rand = Math.random();
      let state: DotState = 'neutral';
      if (rand < 0.3) state = 'success';
      else if (rand < 0.6) state = 'warning';
      else if (rand < 0.8) state = 'error';

      return {
        x: (i % cols) * dotSpacing + dotSpacing,
        y: Math.floor(i / cols) * dotSpacing + dotSpacing,
        state,
      };
    });

    // Create dots
    const circles = svg.selectAll('circle')
      .data(dots)
      .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', dotSize / 2)
      .attr('fill', d => stateColors[d.state])
      .attr('opacity', d => d.state === 'neutral' ? 0.2 : 0.8);

    // Add hover effect
    circles
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', dotSize)
          .attr('opacity', 1);
      })
      .on('mouseout', function(event, d: Dot) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', dotSize / 2)
          .attr('opacity', d.state === 'neutral' ? 0.2 : 0.8);
      });

    // Update animation
    function updateDots(newData: Dot[]) {
      svg.selectAll('circle')
        .data(newData)
        .transition()
        .duration(1000)
        .attr('fill', d => stateColors[d.state])
        .attr('opacity', d => d.state === 'neutral' ? 0.2 : 0.8);
    }

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 100}, 10)`);

    const legendData = [
      { state: 'success' as DotState, label: 'High' },
      { state: 'warning' as DotState, label: 'Medium' },
      { state: 'error' as DotState, label: 'Low' },
    ];

    legendData.forEach((item, i) => {
      const g = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      g.append('circle')
        .attr('r', dotSize / 2)
        .attr('fill', stateColors[item.state])
        .attr('opacity', 0.8);

      g.append('text')
        .attr('x', 10)
        .attr('y', 4)
        .attr('font-size', '10px')
        .attr('fill', '#6B7280')
        .text(item.label);
    });

    // If no data provided, animate randomly
    if (!data) {
      const interval = setInterval(() => {
        const newDots = dots.map(d => {
          const rand = Math.random();
          let state: DotState = 'neutral';
          if (rand < 0.3) state = 'success';
          else if (rand < 0.6) state = 'warning';
          else if (rand < 0.8) state = 'error';
          return { ...d, state };
        });
        updateDots(newDots);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [data]);

  return (
    <div className="w-full h-40 bg-white rounded-lg overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
} 
'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { ClusterInfo, ClusterData, ClusterNode, ClusterLink } from '@/lib/types'

interface ClusterMapProps {
  clusters: ClusterInfo[]
}

// Convert ClusterInfo[] to ClusterData for D3 visualization
function transformClustersToGraphData(clusters: ClusterInfo[]): ClusterData {
  const nodes: ClusterNode[] = clusters.map((cluster, index) => ({
    id: cluster.id.toString(),
    label: cluster.name,
    group: index,
    value: cluster.size,
  }))

  // Create links between clusters based on shared keywords
  const links: ClusterLink[] = []
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const sharedKeywords = clusters[i].keywords.filter((kw) =>
        clusters[j].keywords.includes(kw)
      )
      if (sharedKeywords.length > 0) {
        links.push({
          source: clusters[i].id.toString(),
          target: clusters[j].id.toString(),
          value: sharedKeywords.length,
        })
      }
    }
  }

  return { nodes, links }
}

export function ClusterMap({ clusters }: ClusterMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !clusters || clusters.length === 0) return

    const data = transformClustersToGraphData(clusters)

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()

    // Use container dimensions
    const containerWidth = containerRef.current.clientWidth
    const width = containerWidth > 0 ? containerWidth : 800
    const height = 500

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    // Force simulation with stronger repulsion
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => Math.sqrt(d.value) * 10 + 20))

    // Links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', (d: any) => Math.sqrt(d.value) * 1.5)

    // Tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'hsl(var(--popover))')
      .style('color', 'hsl(var(--popover-foreground))')
      .style('border', '1px solid hsl(var(--border))')
      .style('border-radius', '0.5rem')
      .style('padding', '0.5rem 0.75rem')
      .style('font-size', '0.875rem')
      .style('box-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1)')
      .style('pointer-events', 'none')
      .style('z-index', '50')

    // Nodes
    const node = svg
      .append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => Math.sqrt(d.value) * 8)
      .attr('fill', (d: any) => color(d.group.toString()))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease')
      .on('mouseenter', function(event, d: any) {
        d3.select(this)
          .attr('r', Math.sqrt(d.value) * 10)
          .attr('stroke-width', 3)

        tooltip
          .style('visibility', 'visible')
          .html(`<strong>${d.label}</strong><br/>${d.value}개 문서`)
      })
      .on('mousemove', function(event) {
        tooltip
          .style('top', (event.pageY - 10) + 'px')
          .style('left', (event.pageX + 10) + 'px')
      })
      .on('mouseleave', function(event, d: any) {
        d3.select(this)
          .attr('r', Math.sqrt(d.value) * 8)
          .attr('stroke-width', 2)

        tooltip.style('visibility', 'hidden')
      })
      .call(
        d3.drag<any, any>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      )

    // Labels
    const label = svg
      .append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text((d: any) => `${d.label} (${d.value}개)`)
      .attr('font-size', 14)
      .attr('font-weight', 600)
      .attr('fill', 'hsl(var(--foreground))')
      .attr('dx', (d: any) => Math.sqrt(d.value) * 8 + 8)
      .attr('dy', 4)
      .style('pointer-events', 'none')
      .style('user-select', 'none')

    simulation.on('tick', () => {
      // Constrain nodes within bounds
      data.nodes.forEach((d: any) => {
        const radius = Math.sqrt(d.value) * 8
        const padding = 20
        d.x = Math.max(radius + padding, Math.min(width - radius - padding, d.x))
        d.y = Math.max(radius + padding, Math.min(height - radius - padding, d.y))
      })

      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y)

      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y)
    })

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event: any) {
      const radius = Math.sqrt(event.subject.value) * 8
      const padding = 20
      event.subject.fx = Math.max(radius + padding, Math.min(width - radius - padding, event.x))
      event.subject.fy = Math.max(radius + padding, Math.min(height - radius - padding, event.y))
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    return () => {
      simulation.stop()
      tooltip.remove()
    }
  }, [clusters])

  if (!clusters || clusters.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>클러스터 데이터가 없습니다</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] relative">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}

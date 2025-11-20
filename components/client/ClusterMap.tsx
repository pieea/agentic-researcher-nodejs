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

    // Force simulation
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))

    // Links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(data.links)
      .enter()
      .append('line')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: any) => Math.sqrt(d.value))

    // Nodes
    const node = svg
      .append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => Math.sqrt(d.value) * 3)
      .attr('fill', (d: any) => color(d.group.toString()))
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
      .text((d: any) => d.label)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', 4)

    simulation.on('tick', () => {
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
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    return () => {
      simulation.stop()
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
    <div ref={containerRef} className="w-full h-full min-h-[500px]">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}

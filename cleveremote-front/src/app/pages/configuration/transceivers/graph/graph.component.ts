import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterContentInit } from '@angular/core';
import { UserIdleService } from 'angular-user-idle';
import { timer, Subscription } from 'rxjs';
import * as d3Lib from 'd3';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

export class Message {
  constructor(
    public sender: string,
    public content: string,
    public isBroadcast = false,
  ) { }
}

@Component({
  selector: 'graph-network',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})



export class GraphComponent implements AfterContentInit {
  title = 'app';
  radius = 10;
  public d3 = d3Lib;
  public svg;
  public simulation$;
  public width;
  public height;
  public currentScale: number = 1;
  public zoom;

  constructor(
  ) {

    const t = '';

    const g = t || undefined;
    const y = 0;
    const $zoomed = () => {
      //const g = this.svg.select('g');
      // this.svg.attr("transform", this.d3.event.transform);
      // this.currentScale = this.d3.event.transform.k;
      // const g: any = d3Lib.select("#dragCt");
      // const point = g.node().getBBox();
      // g.node().getBoundingClientRect().x * this.currentScale
      // d3Lib.select(g.node()).attr("transform", (d: any) => {
      //   return "translate(" + [d.x , d.y] + ")" + this.d3.event.transform;
      // });

      //const g = this.svg.select('g');
      this.svg.attr("transform", this.d3.event.transform);
      this.currentScale = this.d3.event.transform.k;
      const g: any = d3Lib.select("#dragCt");
      const parent = this.svg.node().parentNode.getBoundingClientRect();
      const container = g.node().getBoundingClientRect();
      d3Lib.select(g.node()).attr("transform", (d: any) => {
        return "translate(" + [d.x - (container.x - parent.x), d.y - (container.y - parent.y)] + ")" + this.d3.event.transform;
      });

      this.calculatePointText(g.selectAll(".nodes")._groups[0]);
      // d.x += d3Lib.event.dx;
      // d.y += d3Lib.event.dy;
      // // //const currentscale = d3Lib.zoomTransform(this.svg).k;
      // d3Lib.select(g.node()).attr("transform", (d: any) => {

      //   return "translate(" + [d.x, d.y] + ")";
      // });
    };
    this.zoom = this.d3.zoom().on("zoom", $zoomed);
  }

  ngAfterContentInit() {

    this.initSvg();

    setTimeout(() => {
      const dataA = this.initData(2);
      this.buildGraphElemements(dataA);
    }, 1000);

  }

  public zoomIn() {
    this.zoomFunction(0);
  }

  public zoomOut() {
    this.zoomFunction(1);
  }

  public zoomFunction(zoomIn: number, current: boolean = false) {
    this.currentScale = current ? this.currentScale : (zoomIn === 0 ? this.currentScale + 0.1 : this.currentScale - 0.1);
    this.zoom.scaleTo(this.svg, this.currentScale);
  }
  public dragSVG() {
    this.findScale();
  }


  public findScale() {
    const g: any = d3Lib.select("#dragCt");
    d3Lib.select(g.node()).attr("transform", (d: any) => {
      
      const trans = "translate(" + [-d.x, -d.y]+")";
      d.x = 0;
      d.y = 0;
      return trans;
    });
    
    this.zoom.scaleTo(this.svg, 1);
    
    const currentWidth = this.vwTOpx(this.width);
    const currentHeight = this.vhTOpx(this.height);
    const svgWidth = g.node().getBoundingClientRect().width;
    const svgHeight = g.node().getBoundingClientRect().height;
    if (currentWidth > svgWidth) {
      const scaleWidthPercent = ((currentWidth * 100) / svgWidth);
      const scaleHeightPercent = ((currentHeight * 100) / svgHeight);
      const finalscale = Math.min(scaleWidthPercent, scaleHeightPercent) / 100;
      this.zoom.scaleTo(this.svg, finalscale);
      
    } else {
      const scaleWidthPercent = ((currentWidth * 100) / svgWidth);
      const scaleHeightPercent = ((currentHeight * 100) / svgHeight);
      const finalscale = Math.min(scaleWidthPercent, scaleHeightPercent) / 100;
      this.zoom.scaleTo(this.svg, finalscale);

    }

  }

  public buildGraphElemements(dataset) {
    const links = this.createLinks(dataset.links);
    const edgepaths = this.createEdgePaths(dataset.links);
    const edgelabels = this.createEdgeLabels(dataset.links);
    const nodes = this.createNodes(dataset.nodes);
const _this = this;
    const g: any = d3Lib.select("#dragCt");
    g.cx = 0;
    const dragged = (d: any) => {
      // const gPoint = g.node().getBoundingClientRect();
      // const test = Math.abs(d.x + d3Lib.event.dx);
      // if ((test + gPoint.width / 2) <= this.vwTOpx(this.width) / 2) {
      //   d.x += d3Lib.event.dx;
      //   g.cx = d.x;
      // } else {
      //   d.x += 0;
      //   g.cx = g.cx;
      // }

      // const testy = Math.abs(d.y + d3Lib.event.dy);
      // if ((testy + gPoint.height / 2) <= this.vhTOpx(this.height) / 2) {
      //   d.y += d3Lib.event.dy;
      //   g.cy = d.y;
      // } else {
      //   d.y += 0;
      //   g.cy = g.cy;
      // }

      d.y += d3Lib.event.dy;
      d.x += d3Lib.event.dx;
      // //const currentscale = d3Lib.zoomTransform(this.svg).k;
      d3Lib.select(g.node()).attr("transform", (d: any) => {

        return "translate(" + [d.x, d.y] + ")";
      });
      //d3Lib.select(g.node()).attr("cx", d.x = d3Lib.event.x).attr("cy", d.y = d3Lib.event.y);
      this.zoom.scaleTo(this.svg, this.currentScale);

    }

    g.data([{
      // Position of the group
      x: 0,
      y: 0
    }])
      .call(d3Lib.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragend)
      );
    function dragstarted(d) {
      _this.simulation$.stop();
      d3Lib.event.sourceEvent.stopPropagation();
      g.selectAll(".nodes").classed("active", true);
    }
    const scale = this.currentScale
    // function dragged(d) {
    //   // Set the new position
    //   d.x += d3Lib.event.dx;
    //   d.y += d3Lib.event.dy;
    //   //const currentscale = d3Lib.zoomTransform(this.svg).k;
    //   d3Lib.select(this).attr("transform", function (d: any) {
    //     return "translate(" + [d.x, d.y] + ")scale(0.8)"
    //   });

    // }

    function dragend(d) {
      g.selectAll(".nodes").classed("active", false);
    }


    this.startGraph(dataset, links, nodes, edgepaths);
  }

  public startGraph(dataset, links, nodes, edgepaths): void {
    const ticked$ = () => {
      links.attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodes.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      this.findScale();
      this.calculatePointText(nodes._groups[0]);

      edgepaths.attr('d', (d: any) => 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y);
    };
    const simulation$ = () => {
      const width = this.getWidth();
      const height = this.getHeight();
      return (
        this.d3.forceSimulation()
          .force("link", this.d3.forceLink() // This force provides links between nodes
            .id((d: any) => d.id)
            .distance(50)
          )
          .force("charge", this.d3.forceManyBody().strength(-400)) // This adds repulsion (if it's negative) between nodes. 
          .force("center", this.d3.forceCenter(width / 2, height / 2))
      ) as any;
    };

    const simulationResult = simulation$()
      .nodes(dataset.nodes)
      .on("tick", ticked$);

    simulationResult.force("link")
      .links(dataset.links);

    this.simulation$ = simulationResult;
  }

  

  public createLinks(dataset): any {
    const links = this.svg.selectAll(".links")
      .data(dataset)
      .enter().append('line')
      .attr("class", "links")
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke-width', '5');

    links.append("title")
      .text(d => d.type);

    links.exit().remove();

    return links;
  }

  public createEdgePaths(dataset): any {
    const edgepaths = this.svg.selectAll(".edgepath")
      .data(dataset)
      .enter().append('path')
      .attr('class', 'edgepath')
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .attr('stroke-width', '5')
      .attr('fill', 'red')
      .attr('id', function (d, i) { return 'edgepath' + i })
      .style("pointer-events", "none");
    edgepaths.exit().remove();

    return edgepaths;
  }

  public createEdgeLabels(dataset): any {
    const edgelabels = this.svg.selectAll(".edgelabel")
      .data(dataset)
      .enter().append('text')
      .style("pointer-events", "auto")
      .attr('class', 'edgelabel')
      .attr('id', function (d, i) { return 'edgelabel' + i })
      .attr('font-size', 10)
      .attr('fill', '#aaa')
      .style("cursor", "pointer");

    edgelabels.append('textPath')
      .attr('xlink:href', function (d, i) { return '#edgepath' + i })
      .style("text-anchor", "middle")
      .style("pointer-events", "auto")
      .attr("startOffset", "50%")
      .text(d => d.type);
    edgelabels.exit().remove();


    edgelabels.on('click', (d: any) => {
      console.log('test click link');
    });
    return edgelabels;
  }

  calculatePointText(elements: Array<any>) {
    const graph: any = d3Lib.select("#dragCt");
    const pg = graph.node().getBBox();
    const coordinatorPoint = graph.selectAll(".nodes")._groups[0][0].getBoundingClientRect();

    const testPointx = (Math.abs(pg.x) + pg.width) / 2;
    const testPointy = (Math.abs(pg.y) + pg.height) / 2;

    elements.forEach(element => {
      const node = d3Lib.select(element);
      const nodePoint = node.node().getBoundingClientRect();

      if (nodePoint.x > coordinatorPoint.x) {
        node.select('text').attr('dx', 0);
      } else {
        const p = (node.select('text').node() as any).getBBox();
        node.select('text').attr('dx', -(0 + p.width));
      }

      if (nodePoint.y < coordinatorPoint.y) {
        node.select('text').attr('dy', -15);
      } else {
        const p = (node.select('text').node() as any).getBBox();
        node.select('text').attr('dy', 25);
      }

    });
  }

  public createNodes(dataset): any {
    const _this = this;
    const nodes = this.svg.selectAll(".nodes")
      .data(dataset)
      .enter().append('g')
      .attr("class", "nodes")
      .call(this.d3.drag()
        .on("start", (d: any) => {
          if (!d3Lib.event.active) {
            this.simulation$.alphaTarget(0.1).restart();
          }
          d.fy = d.y;
          d.fx = d.x;
        })
        .on("drag", function (d: any) {
          d.fx = d3Lib.event.x;
          d.fy = d3Lib.event.y;
          _this.calculatePointText([this]);
        })
      );

    nodes.append("circle")
      .attr("r", d => 15)
      .style("stroke", "grey")
      .style("stroke-opacity", 0.3)
      .style("stroke-width", (d: any) => d.runtime / 10)
      .style("fill", (d: any) => this.colorScale()(d.group))
      .style("cursor", "pointer");

    nodes.append("title")
      .text(d => d.id + ": " + d.label + " - " + d.group + ", runtime:" + d.runtime + "min");

    nodes.append("text")
      .attr("dy", 25)
      .attr("dx", 25)
      .text(d => d.name);

    // nodes.append("text")
    //   .attr("dy", 12)
    //   .attr("dx", -8)
    //   .text(d => d.runtime);

    nodes.exit().remove();

    nodes.on('click', (d: any) => {
      console.log('test click node');
    });


    return nodes;
  }

  public initData(type = 0) {
    if (type === 0) {
      return {
        nodes: [
          { id: 1, name: 'coordinator', label: 'coordinator', group: 'Team C', runtime: 20 },
          { id: 2, name: 'router1', label: 'router 1', group: 'Team A', runtime: 60 }
        ],
        links: [
          { source: 1, target: 2, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 2, target: 1, type: 'SIGNAL STRENGTH -->> 255' }
        ]
      };
    } else if (type === 1) {
      return {
        nodes: [
          { id: 1, name: 'coordinator', label: 'coordinator', group: 'Team C', runtime: 20 },
          { id: 2, name: 'router1', label: 'router 1', group: 'Team A', runtime: 60 },
          { id: 3, name: 'endDevice1', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 4, name: 'endDevice2', label: 'endDevice2', group: 'Team B', runtime: 40 },
          { id: 5, name: 'endDevice3', label: 'endDevice3', group: 'Team B', runtime: 40 },
          { id: 6, name: 'endDevice4', label: 'endDevice4', group: 'Team B', runtime: 40 },
          { id: 7, name: 'router2', label: 'router 1', group: 'Team A', runtime: 60 },
          { id: 8, name: 'endDevice5', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 9, name: 'endDevice5', label: 'endDevice2', group: 'Team B', runtime: 40 },
          { id: 10, name: 'endDevice7', label: 'endDevice3', group: 'Team B', runtime: 40 },
          { id: 11, name: 'endDevice8', label: 'endDevice4', group: 'Team B', runtime: 40 },
        ],
        links: [
          { source: 1, target: 2, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 2, target: 1, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 2, target: 3, type: 'SIGNAL STRENGTH -->> 168' },
          { source: 2, target: 4, type: 'SIGNAL STRENGTH -->> 200' },
          { source: 2, target: 5, type: 'SIGNAL STRENGTH -->> 130' },
          { source: 2, target: 6, type: 'SIGNAL STRENGTH -->> 124' },

          { source: 1, target: 7, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 7, target: 1, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 7, target: 8, type: 'SIGNAL STRENGTH -->> 168' },
          { source: 7, target: 9, type: 'SIGNAL STRENGTH -->> 200' },
          { source: 7, target: 10, type: 'SIGNAL STRENGTH -->> 130' },
          { source: 7, target: 11, type: 'SIGNAL STRENGTH -->> 124' },
        ]
      };
    } else if (type === 2) {
      return {
        nodes: [
          { id: 1, name: 'coordinator', label: 'coordinator', group: 'Team C', runtime: 20 },
          { id: 2, name: 'router1', label: 'router 1', group: 'Team A', runtime: 60 },
          { id: 3, name: 'endDevice1', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 4, name: 'endDevice2', label: 'endDevice2', group: 'Team B', runtime: 40 },
          { id: 5, name: 'endDevice3', label: 'endDevice3', group: 'Team B', runtime: 40 },
          { id: 6, name: 'endDevice4', label: 'endDevice4', group: 'Team B', runtime: 40 },
          { id: 7, name: 'router2', label: 'router 1', group: 'Team A', runtime: 60 },
          { id: 8, name: 'endDevice5', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 9, name: 'endDevice5', label: 'endDevice2', group: 'Team B', runtime: 40 },

          { id: 10, name: 'router3', label: 'router 3', group: 'Team A', runtime: 60 },
          { id: 11, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 13, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 14, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 15, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 16, name: 'router3', label: 'router 3', group: 'Team A', runtime: 60 },
          { id: 17, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 18, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 19, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 20, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 21, name: 'router3', label: 'router 3', group: 'Team A', runtime: 60 },
          { id: 22, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 23, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 24, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 25, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 26, name: 'router3', label: 'router 3', group: 'Team A', runtime: 60 },
          { id: 27, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 28, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 29, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 30, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 31, name: 'router3', label: 'router 3', group: 'Team A', runtime: 60 },
          { id: 32, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 33, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 34, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 35, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          // { id: 36, name: 'router3', label: 'router 3', group: 'Team A', runtime: 60 },
          // { id: 37, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          // { id: 38, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          // { id: 39, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          // { id: 40, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },
        ],
        links: [
          { source: 1, target: 2, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 2, target: 1, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 2, target: 3, type: 'SIGNAL STRENGTH -->> 168' },
          { source: 2, target: 4, type: 'SIGNAL STRENGTH -->> 200' },
          { source: 2, target: 5, type: 'SIGNAL STRENGTH -->> 130' },
          { source: 2, target: 6, type: 'SIGNAL STRENGTH -->> 124' },

          { source: 1, target: 7, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 7, target: 1, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 7, target: 8, type: 'SIGNAL STRENGTH -->> 168' },
          { source: 7, target: 9, type: 'SIGNAL STRENGTH -->> 200' },

          { source: 1, target: 10, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 10, target: 1, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 10, target: 11, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 10, target: 13, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 10, target: 14, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 10, target: 15, type: 'SIGNAL STRENGTH -->> 255' },

          { source: 1, target: 16, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 16, target: 1, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 16, target: 17, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 16, target: 18, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 16, target: 19, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 16, target: 20, type: 'SIGNAL STRENGTH -->> 255' },


          { source: 1, target: 21, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 21, target: 1, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 21, target: 22, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 21, target: 23, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 21, target: 24, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 21, target: 25, type: 'SIGNAL STRENGTH -->> 255' },

          { source: 1, target: 26, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 26, target: 1, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 26, target: 27, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 26, target: 28, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 26, target: 29, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 26, target: 30, type: 'SIGNAL STRENGTH -->> 255' },

          { source: 26, target: 31, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 31, target: 26, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 31, target: 32, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 31, target: 33, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 31, target: 34, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 31, target: 35, type: 'SIGNAL STRENGTH -->> 255' },

          // { source: 31, target: 36, type: 'SIGNAL STRENGTH -->> 255' },
          // { source: 36, target: 31, type: 'SIGNAL STRENGTH -->> 255' },
          // { source: 36, target: 37, type: 'SIGNAL STRENGTH -->> 255' },
          // { source: 36, target: 38, type: 'SIGNAL STRENGTH -->> 255' },
          // { source: 36, target: 39, type: 'SIGNAL STRENGTH -->> 255' },
          // { source: 36, target: 40, type: 'SIGNAL STRENGTH -->> 255' },

        ]
      };
    } else if (type === 3) {
      return {
        nodes: [
          { id: 36, name: 'router3', label: 'router 3', group: 'Team A', runtime: 60 },
          { id: 37, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 38, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 39, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 40, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },
        ],
        links: [
          { source: 31, target: 36, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 36, target: 31, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 36, target: 37, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 36, target: 38, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 36, target: 39, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 36, target: 40, type: 'SIGNAL STRENGTH -->> 255' },

        ]
      };
    }

  }

  public initSvg() {
    this.width = 65; //45 for desktop
    this.height = 65;

    if (!this.svg) {
      this.svg = this.d3.select('div#container')
        .append("svg")
        .attr("width", `${this.width}vw`)
        .attr("height", `${this.height}vh`)
        .classed("svg-content", true)
        .append("g")
        .attr("id", 'dragCt')
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("transform", `translate(${this.getMargin().left},${this.getMargin().top})`);

      this.svg.append('defs').append('marker')
        .attr("id", 'arrowhead')
        .attr("viewBox", `0 0 ${this.vwTOpx(this.width)} ${this.vhTOpx(this.height)}`)
        .attr('refX', 0)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 13)
        .attr('markerHeight', 13)
        .attr('xoverflow', 'visible')
        .attr('yoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke', 'none');
    }


    // function drag_this() {
    //   return d3Lib.drag().subject(this)
    //     .on('start', function (d: any) {
    //       if (d.x1) {
    //         d.x1 = d3Lib.event.x - d.xt;
    //         d.y1 = d3Lib.event.y - d.yt;
    //       } else {
    //         d.x1 = d3Lib.event.x;
    //         d.y1 = d3Lib.event.y;
    //       }
    //     })
    //     .on('drag', function (d: any) {
    //       d3Lib.select(this)
    //         .attr("transform", "translate(" + (d3Lib.event.x - d.x1) + "," + (d3Lib.event.y - d.y1) + ")");

    //       d.xt = d3Lib.event.x - d.x1;
    //       d.yt = d3Lib.event.y - d.y1;
    //     });
    // }
    // this.svg.call(drag_this);
  }


  public initLegend() {
    const legend_g = this.svg.selectAll(".legend")
      .data(this.colorScale().domain())
      .enter().append("g")
      .attr("transform", (d, i) => `translate(${this.getWidth()},${i * 20})`);

    legend_g.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 5)
      .attr("fill", this.colorScale());

    legend_g.append("text")
      .attr("x", 10)
      .attr("y", 5)
      .text((d: any) => d);

    const legend_g2 = this.svg.append("g")
      .attr("transform", `translate(${this.getWidth()}, 120)`);

    legend_g2.append("circle")
      .attr("r", 5)
      .attr("cx", 0)
      .attr("cy", 0)
      .style("stroke", "grey")
      .style("stroke-opacity", 0.3)
      .style("stroke-width", 15)
      .style("fill", "black");
    legend_g2.append("text")
      .attr("x", 15)
      .attr("y", 0)
      .text("long runtime");

    legend_g2.append("circle")
      .attr("r", 5)
      .attr("cx", 0)
      .attr("cy", 20)
      .style("stroke", "grey")
      .style("stroke-opacity", 0.3)
      .style("stroke-width", 2)
      .style("fill", "black");
    legend_g2.append("text")
      .attr("x", 15)
      .attr("y", 20)
      .text("short runtime");
  }

  public getMargin() {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  public getWidth() {
    const margin = this.getMargin();
    return this.vwTOpx(this.width) - margin.left - margin.right;
  }

  public getHeight() {
    const margin = this.getMargin();
    return this.vhTOpx(this.height) - margin.top - margin.bottom;
  }

  public vwTOpx(value) {
    var w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      x = w.innerWidth || e.clientWidth || g.clientWidth;

    var result = (x * value) / 100;
    return (result);
  }

  buildViewBoxAttribute() {
    //return `0 0 ${this.vwTOpx(45)} 20`;
    return `0 0 10 10`;
  }

  public vhTOpx(value) {
    var w = window,
      d = document,
      e = d.documentElement,
      g = d.getElementsByTagName('body')[0],
      y = w.innerHeight || e.clientHeight || g.clientHeight;

    var result = (y * value) / 100;
    return (result);
  }

  public colorScale() {
    return this.d3.scaleOrdinal() //=d3.scaleOrdinal(d3.schemeSet2)
      .domain(["Team A", "Team B", "Team C", "Team D", "Team E"])
      .range(['#ff9e6d', '#86cbff', '#c2e5a0', '#fff686', '#9e79db']) as any;
  }
}
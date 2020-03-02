import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterContentInit } from '@angular/core';
import { ApiRequestsService } from "../../services/api-requests.service";
import { AuthService } from "../../auth/auth.service";
import { UserIdleService } from 'angular-user-idle';
import { timer, Subscription } from 'rxjs';
import { DataService } from '../../services/websocket/websocket.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TimerService } from '../../services/timer.service';
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
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [DataService]
})



export class ProfileComponent implements AfterContentInit {
  title = 'app';
  radius = 10;
  public d3 = d3Lib;
  public svg;
  public simulation$;

  constructor(
    private userIdle: UserIdleService,
    private apiRequestsService: ApiRequestsService,
    private authService: AuthService,
    private dataService: DataService,
    private modalService: NgbModal,
    private timerService: TimerService) {

    const t = '';

    const g = t || undefined;
    const y = 0;

  }

  ngAfterContentInit() {

    this.apiRequestsService.getAllLogs('server_1').subscribe(response => {
      const t = 2;
    });
    this.initSvg();

    const dataset = this.initData(2);
    this.buildGraphElemements(dataset);

    // setTimeout(() => {
    //   const dataA = this.initData(1);
    //   this.buildGraphElemements(dataA);
    // }, 5000);

    // setTimeout(() => {
    //   const dataB = this.initData(1);
    //   this.buildGraphElemements(dataB);
    // }, 10000);

    this.initLegend();

  }

  public buildGraphElemements(dataset) {
    const links = this.createLinks(dataset.links);
    const edgepaths = this.createEdgePaths(dataset.links);
    const edgelabels = this.createEdgeLabels(dataset.links);
    const nodes = this.createNodes(dataset.nodes);

    this.startGraph(dataset, links, nodes, edgepaths);
  }

  public startGraph(dataset, links, nodes, edgepaths): void {
    const ticked$ = () => {
      links.attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodes.attr("transform", (d: any) => `translate(${d.x},${d.y})`);

      edgepaths.attr('d', (d: any) => 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y);
    };
    const simulation$ = () => {
      const width = this.getWidth();
      const height = this.getHeight();
      return (
        this.d3.forceSimulation()
          .force("link", this.d3.forceLink() // This force provides links between nodes
            .id((d: any) => d.id)
            .distance(120)
          )
          .force("charge", this.d3.forceManyBody().strength(-300)) // This adds repulsion (if it's negative) between nodes. 
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
      .join("line")
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
      .join("path")
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
      .join('text')
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

  public createNodes(dataset): any {
    const nodes = this.svg.selectAll(".nodes")
      .data(dataset)
      .join("g")
      .attr("class", "nodes")
      .call(this.d3.drag()
        .on("start", (d: any) => {
          if (!d3Lib.event.active) {
            this.simulation$.alphaTarget(0.1).restart();
          }
          d.fy = d.y;
          d.fx = d.x;
        })
        .on("drag", (d: any) => {
          d.fx = d3Lib.event.x;
          d.fy = d3Lib.event.y;
        })
      );

    nodes.append("circle")
      .attr("r", d => 30)
      .style("stroke", "grey")
      .style("stroke-opacity", 0.3)
      .style("stroke-width", (d: any) => d.runtime / 10)
      .style("fill", (d: any) => this.colorScale()(d.group))
      .style("cursor", "pointer");

    nodes.append("title")
      .text(d => d.id + ": " + d.label + " - " + d.group + ", runtime:" + d.runtime + "min");

    nodes.append("text")
      .attr("dy", 4)
      .attr("dx", -25)
      .text(d => d.name);

    nodes.append("text")
      .attr("dy", 12)
      .attr("dx", -8)
      .text(d => d.runtime);

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
          { id: 2, name: 'router1', label: 'router 1', group: 'Team A', runtime: 60 },
          { id: 3, name: 'endDevice1', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 4, name: 'endDevice2', label: 'endDevice2', group: 'Team B', runtime: 40 },
          { id: 5, name: 'endDevice3', label: 'endDevice3', group: 'Team B', runtime: 40 },
          { id: 6, name: 'endDevice4', label: 'endDevice4', group: 'Team B', runtime: 40 },
        ],
        links: [
          { source: 1, target: 2, type: 'Signal -->> 255' },
          { source: 2, target: 1, type: 'SIGNAL STRENGTH -->> 255' },
          { source: 2, target: 3, type: 'SIGNAL STRENGTH -->> 168' },
          { source: 2, target: 4, type: 'SIGNAL STRENGTH -->> 200' },
          { source: 2, target: 5, type: 'SIGNAL STRENGTH -->> 130' },
          { source: 2, target: 6, type: 'SIGNAL STRENGTH -->> 124' },
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
        ]
      };
    }

  }

  public initSvg() {
    if (!this.svg) {
      this.svg = this.d3.select('#content')
        .append("svg")
        .attr("width", this.getWidth() + this.getMargin().left + this.getMargin().right)
        .attr("height", this.getHeight() + this.getMargin().top + this.getMargin().bottom)
        .append("g")
        .attr("transform", `translate(${this.getMargin().left},${this.getMargin().top})`);

      this.svg.append('defs').append('marker')
        .attr("id", 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 23)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 13)
        .attr('markerHeight', 13)
        .attr('xoverflow', 'visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke', 'none');
    }
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
    return { top: 30, right: 80, bottom: 5, left: 5 };
  }

  public getWidth() {
    const margin = this.getMargin();
    return 890 - margin.left - margin.right;
  }

  public getHeight() {
    const margin = this.getMargin();
    return 800 - margin.top - margin.bottom;
  }

  public colorScale() {
    return this.d3.scaleOrdinal() //=d3.scaleOrdinal(d3.schemeSet2)
      .domain(["Team A", "Team B", "Team C", "Team D", "Team E"])
      .range(['#ff9e6d', '#86cbff', '#c2e5a0', '#fff686', '#9e79db']) as any;
  }
}

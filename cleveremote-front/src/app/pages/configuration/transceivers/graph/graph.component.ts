import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterContentInit, Input } from '@angular/core';
import { UserIdleService } from 'angular-user-idle';
import { timer, Subscription } from 'rxjs';
import * as d3Lib from 'd3';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { NbIconLibraries } from '@nebular/theme';
import * as difference from 'lodash.difference';

export class Message {
  constructor(
    public sender: string,
    public content: string,
    public isBroadcast = false,
  ) { }
}

export enum STATUS {
  NONE = 'NONE',
  LOAD = "LOAD",
  LOAD_SAVED = "LOAD_SAVED"
}

@Component({
  selector: 'graph-network',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})



export class GraphComponent implements AfterContentInit, OnDestroy {
  title = 'app';
  radius = 10;
  public d3 = d3Lib;
  public svg;
  public simulation$;
  public width;
  public height;
  public currentScale: number = 1;
  public zoom;
  public dataset;
  public filter: Array<any>;
  @Input() revealed: any;
  public status: STATUS;
  constructor(iconsLibrary: NbIconLibraries
  ) {
    iconsLibrary.registerFontPack('fa', { packClass: 'fa', iconClassPrefix: 'fa' });
    iconsLibrary.registerFontPack('fas', { packClass: 'fas', iconClassPrefix: 'fa' });
    const t = '';

    const g = t || undefined;
    const y = 0;
    const $zoomed = () => {
      if (isNaN(this.d3.event.transform.x) || isNaN(this.d3.event.transform.y)) {
        this.d3.event.transform.x = 0;
        this.d3.event.transform.y = 0;
      }
      this.svg.attr("transform", this.d3.event.transform);
      this.currentScale = this.d3.event.transform.k;
      const g: any = d3Lib.select("#dragCt");
      const parent = this.svg.node().parentNode.getBoundingClientRect();
      const container = g.node().getBoundingClientRect();
      d3Lib.select(g.node()).attr("transform", (d: any) => {
        return "translate(" + [d.x - (container.x - parent.x), d.y - (container.y - parent.y)] + ")" + this.d3.event.transform;
      });

      this.calculatePointText(g.selectAll(".nodes")._groups[0]);
    };
    this.zoom = this.d3.zoom().on("zoom", $zoomed);
  }

  ngOnDestroy(): void {
    this.simulation$.stop();
  }

  ngAfterContentInit() {

    this.initSvg();

    setTimeout(() => {
      this.loadLayout();
    }, 1000);

  }

  public zoomIn() {
    this.zoomFunction(0);
  }

  public zoomOut() {
    this.zoomFunction(1);
  }

  public zoomFunction(zoomIn: number, current: boolean = false) {
    this.simulation$.stop();
    this.currentScale = current ? this.currentScale : (zoomIn === 0 ? this.currentScale + 0.1 : this.currentScale - 0.1);
    this.zoom.scaleTo(this.svg, this.currentScale);
  }

  public fitGraph() {
    this.simulation$.stop();
    this.findScale();
  }

  public organizeGraph() {
    this.clearLayoutData(true);
    this.updateGraphData(this.dataset);
  }

  public saveLayout() {
    localStorage.setItem('graphData', JSON.stringify(this.dataset));
  }

  public loadLayout() {
    const data = undefined;//localStorage.getItem('graphData');
    if (data) {
      this.status = STATUS.LOAD_SAVED;
      this.dataset = JSON.parse(data);
    } else {
      this.status = STATUS.LOAD;
      this.dataset = this.initData(2);
    }

    this.buildGraphElemements(this.dataset);
  }

  public removeElements() {
    this.clearLayoutData(false);
    const newData = this.initData(1);
    this.updateLayoutData(newData);
    this.dataset = newData;
    this.filter = [];
    this.updateGraphData(this.dataset);
  }

  public addElements() {
    this.clearLayoutData(false);
    const newdata = this.initData(3);
    this.filter = difference(newdata.nodes.map(x => x.id), this.dataset.nodes.map(x => x.id));
    this.filter = this.filter && this.filter.length > 0 ? this.filter : undefined;
    this.dataset = newdata;
    this.updateGraphData(this.dataset);
  }

  public clearLayoutData(includeNodes: boolean) {
    if (this.dataset.links[0].source instanceof Object) {
      this.dataset.links.forEach((link, index) => {
        this.dataset.links[index] = { source: link.source.id, target: link.target.id, type: '-->> 255' };
      });
    }
    if (includeNodes) {
      this.dataset.nodes.forEach((node, index) => {
        this.dataset.nodes[index] = { id: node.id, name: node.name, label: node.label, group: node.group, runtime: node.runtime };
      });
    }
  }

  public updateLayoutData(newData: any) {

    newData.nodes.forEach((node, index) => {
      const previous = this.dataset.nodes.find((n) => n.id === node.id);
      newData.nodes;
      node.x = previous.x;
      node.y = previous.y;
      node.vy = previous.vy;
      node.vx = previous.vx;
      node.fx = previous.fx;
      node.fy = previous.fx;
    });
  }

  public findScale() {
    const g: any = d3Lib.select("#dragCt");
    d3Lib.select(g.node()).attr("transform", (d: any) => {

      const trans = "translate(" + [-d.x, -d.y] + ")";
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

  public updateGraphData(currentDataSet: any) {
    this.simulation$.stop();
    this.svg.selectAll('.links').data(currentDataSet.links).exit().remove();
    if (currentDataSet.links[0].source instanceof Object) {
      currentDataSet.links.forEach((link, index) => {
        currentDataSet.links[index] = { source: link.source.id, target: link.target.id, type: '-->> 255', data: link.data };
      });
    }


    //this.svg.selectAll('.links').remove();
    this.svg.selectAll('.edgepath').data(currentDataSet.links).exit().remove();
    this.svg.selectAll('.edgelabel').data(currentDataSet.links).exit().remove();
    this.svg.selectAll('.nodes').data(currentDataSet.nodes).exit().remove();

    this.createLinks(currentDataSet.links, true);
    this.createEdgePaths(currentDataSet.links, true);
    this.createEdgeLabels(currentDataSet.links, true);
    this.createNodes(currentDataSet.nodes, true);

    this.startGraph(currentDataSet, this.filter);

    setTimeout(() => {
      this.filter = undefined;
    }, 1000);


  }

  public buildGraphElemements(dataset) {
    if (dataset.links[0].source instanceof Object) {
      dataset.links.forEach((link, index) => {
        dataset.links[index] = { source: link.source.id, target: link.target.id, type: '-->> 255', data: link.data };
      });
    }
    const links = this.createLinks(dataset.links);
    const edgepaths = this.createEdgePaths(dataset.links);
    const edgelabels = this.createEdgeLabels(dataset.links);
    const nodes = this.createNodes(dataset.nodes);

    const _this = this;
    const g: any = d3Lib.select("#dragCt");
    g.cx = 0;
    const dragged = (d: any) => {
      d.y += d3Lib.event.dy;
      d.x += d3Lib.event.dx;
      d3Lib.select(g.node()).attr("transform", (d: any) => {
        return "translate(" + [d.x, d.y] + ")";
      });
      this.zoom.scaleTo(this.svg, this.currentScale);
    }

    g.data([{ x: 0, y: 0 }])
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

    function dragend(d) {
      g.selectAll(".nodes").classed("active", false);
    }

    this.startGraph(dataset);
  }


  public startGraph(dataset, filter?: Array<any>): void {

    const ticked$ = () => {

      let nodes = this.svg.selectAll('.nodes');
      let links = this.svg.selectAll('.links');
      let edgepaths = this.svg.selectAll('.edgepath');
      let edgeLabels = this.svg.selectAll('.edgelabel');

      if (this.filter && this.filter.length > 0) {
        links = this.svg.selectAll('.links').filter((link) => this.filter.indexOf(link.source.id) !== -1 || this.filter.indexOf(link.target.id) !== -1);
        nodes = this.svg.selectAll('.nodes').filter((node) => this.filter.indexOf(node.id) !== -1);
        edgepaths = this.svg.selectAll('.edgepath').filter((edgepath) => this.filter.indexOf(edgepath.source.id) !== -1 || this.filter.indexOf(edgepath.target.id) !== -1);
        edgeLabels = this.svg.selectAll('.edgelabel').filter((edgepath) => this.filter.indexOf(edgepath.source.id) !== -1 || this.filter.indexOf(edgepath.target.id) !== -1);
      }

      links._groups[0].forEach((link) => {
        const firstChild = link.parentNode.firstChild;
        if (firstChild) {
          link.parentNode.insertBefore(link, firstChild);
        }
      });


      links.attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodes.attr("fx", (d: any) => d.x)
        .attr("fy", (d: any) => d.y);

      nodes.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      if (this.filter && this.filter.length > 0) {
        nodes.attr("display", 'none');
        links.attr("display", 'none');
        edgepaths.attr("display", 'none');
        edgeLabels.attr("display", 'none');
      } else {
        nodes.attr("display", 'block');
        links.attr("display", 'block');
        edgepaths.attr("display", 'block');
        edgeLabels.attr("display", 'block');
      }

      if (this.status = STATUS.LOAD) {
        this.findScale();
      }

      this.calculatePointText(nodes._groups[0]);

      edgepaths.attr('d', (d: any) => 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y);
    };
    const simulation$ = () => {
      const width = this.getWidth();
      const height = this.getHeight();
      return (
        this.d3.forceSimulation()
          .force("link", this.d3.forceLink()
            .id((d: any) => d.id)
            .distance(50)
          )
          .force("charge", this.d3.forceManyBody().strength(-800))
          .force("center", this.d3.forceCenter(width / 2, height / 2))
      ) as any;
    };


    if (this.status = STATUS.LOAD_SAVED) {
      this.status = STATUS.NONE;
      for (let index = 0; index < dataset.nodes.length; index++) {
        dataset.nodes[index].fx = dataset.nodes[index].x;
        dataset.nodes[index].fy = dataset.nodes[index].y;
        dataset.nodes[index].fixed = 1;
      }
    }

    const simulationResult = simulation$();



    simulationResult.nodes(dataset.nodes)
      .on('tick', ticked$);

    simulationResult.force('link')
      .links(dataset.links);


    this.simulation$ = simulationResult;
  }

  public createLinks(dataset, merge: boolean = false): any {
    let links = this.svg.selectAll(".links")
      .data(dataset)
      .enter().append('line')
      .attr("class", "links")
      .attr('marker-end', 'url(#arrowhead)')
      .attr('stroke-width', '5');

    links.append("title")
      .text(d => d.type);

    links.merge(links);
    links.exit().remove();

    return links;
  }

  public createEdgePaths(dataset, merge: boolean = false): any {
    let edgepaths = this.svg.selectAll(".edgepath")
      .data(dataset)
      .enter().append('path')
      .attr('class', 'edgepath')
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .attr('stroke-width', '5')
      .attr('fill', '#aaa')
      .attr('id', function (d, i) { return 'edgepath' + i })
      .style("pointer-events", "none");


    edgepaths.merge(edgepaths);

    edgepaths.exit().remove();

    return edgepaths;
  }

  public createEdgeLabels(dataset, merge: boolean = false): any {
    let edgelabels = this.svg.selectAll(".edgelabel")
      .data(dataset)
      .enter().append('text')
      .style("pointer-events", "auto")
      .attr('class', 'edgelabel')
      .attr('id', function (d, i) { return 'edgelabel' + i })
      .attr('font-size', 10)
      .attr('font-weight', 'bold')
      .attr("dy", -2)

      .attr('fill', function (d) { return (d.data && d.data.strength > 0 ? 'green' : 'red') })
      .style("cursor", "pointer");

    edgelabels.append('textPath')
      .attr('xlink:href', function (d, i) { return '#edgepath' + i })
      .style("text-anchor", "middle")
      .style("pointer-events", "auto")
      .attr("startOffset", "50%")
      .text(d => d.type);



    edgelabels.merge(edgelabels);
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
      if ((node.data()[0] as any).group === "Team B") {
        if (nodePoint.x > coordinatorPoint.x) {
          node.select('text').attr('dx', 0);
        } else {
          const p = (node.select('text').node() as any).getBBox();
          node.select('text').attr('dx', -(0 + p.width));
        }

        if (nodePoint.y < coordinatorPoint.y) {
          node.select('text').attr('dy', -17);
        } else {
          node.select('text').attr('dy', 27);
        }
      }
    });
  }

  public createNodes(dataset, merge: boolean = false): any {
    const _this = this;
    let nodes = this.svg.selectAll(".nodes")
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
      //.style("stroke", "grey")
      //.style("stroke-opacity", 0.3)
      //.style("stroke-width", (d: any) => d.runtime / 10)
      .style("stroke", function (d) { return d.group === 'Team A' ? '#86d698' : 'grey'; }) //#86d698 green #ff0018 red #fd9b4a orange
      .style("stroke-opacity", function (d) { return d.group === 'Team A' ? 1 : 0.3; })
      .style("stroke-width", (d: any) => d.group === 'Team A' ? 4 : d.runtime / 10)
      .style("fill", (d: any) => this.colorScale()(d.group))
      .style("cursor", "pointer");

    nodes.append("title")
      .text(d => d.id + ": " + d.label + " - " + d.group + ", runtime:" + d.runtime + "min");

    nodes.append("text")
      .attr("dy", function () { return 5; })
      .attr("dx", function () { return -7; })
      .style("fill", 'rgb(95, 94, 94)')
      .style("font-weight", 600)
      .text(d => d.name);

    // nodes.append("text")
    //   .attr("dy", 12)
    //   .attr("dx", -8)
    //   .text(d => d.runtime);


    const t = nodes.merge(nodes);


    //nodes.exit().remove();

    nodes.on('click', (d: any) => {
      console.log('test click node');
      this.revealed.visible = !this.revealed.visible;
    });


    return nodes;
  }

  public initData(type = 0) {
    if (type === 0) {
      // return JSON.parse(`{"nodes":[{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fixed":1,"index":0,"x":657.3499848281795,"y":316.54404939884074,"vy":0.0017350565819290436,"vx":0.004498328133147586},{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":1,"x":599.4842735858354,"y":249.84402755850698,"vy":0.001639322539027913,"vx":0.005180308736615491},{"id":3,"name":"endDevice1","label":"endDevice1","group":"Team B","runtime":40,"fixed":1,"index":2,"x":561.2085181170676,"y":184.15615489757676,"vy":0.0009041098000753303,"vx":0.006219613646110104},{"id":4,"name":"endDevice2","label":"endDevice2","group":"Team B","runtime":40,"fixed":1,"index":3,"x":536.8588664108388,"y":287.0317688330596,"vy":0.0005545646577525152,"vx":0.004441593956377568},{"id":5,"name":"endDevice3","label":"endDevice3","group":"Team B","runtime":40,"fixed":1,"index":4,"x":525.2988208851682,"y":230.05681557645255,"vy":0.0002951844227947501,"vx":0.0055973230220889006},{"id":6,"name":"endDevice4","label":"endDevice4","group":"Team B","runtime":40,"fixed":1,"index":5,"x":624.1280442104007,"y":181.6792464301932,"vy":0.0019051315580896745,"vx":0.006187588136229895},{"id":7,"name":"router2","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":6,"x":692.7827474974492,"y":395.5542668832953,"vy":0.0017098253559865455,"vx":0.004124632984863109},{"id":8,"name":"endDevice5","label":"endDevice1","group":"Team B","runtime":40,"fixed":1,"index":7,"x":668.5801315913837,"y":462.0893391361523,"vy":0.0017445523132752052,"vx":0.004099187976375954},{"id":9,"name":"endDevice5","label":"endDevice2","group":"Team B","runtime":40,"fixed":1,"index":8,"x":750.3534611527298,"y":433.78106416387806,"vy":0.0012451307265845288,"vx":0.004499702460309589}],"links":[{"source":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fixed":1,"index":0,"x":657.3499848281795,"y":316.54404939884074,"vy":0.0017350565819290436,"vx":0.004498328133147586},"target":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":1,"x":599.4842735858354,"y":249.84402755850698,"vy":0.001639322539027913,"vx":0.005180308736615491},"type":"-->> 255","index":0},{"source":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":1,"x":599.4842735858354,"y":249.84402755850698,"vy":0.001639322539027913,"vx":0.005180308736615491},"target":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fixed":1,"index":0,"x":657.3499848281795,"y":316.54404939884074,"vy":0.0017350565819290436,"vx":0.004498328133147586},"type":"-->> 255","index":1},{"source":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":1,"x":599.4842735858354,"y":249.84402755850698,"vy":0.001639322539027913,"vx":0.005180308736615491},"target":{"id":3,"name":"endDevice1","label":"endDevice1","group":"Team B","runtime":40,"fixed":1,"index":2,"x":561.2085181170676,"y":184.15615489757676,"vy":0.0009041098000753303,"vx":0.006219613646110104},"type":"-->> 168","index":2},{"source":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":1,"x":599.4842735858354,"y":249.84402755850698,"vy":0.001639322539027913,"vx":0.005180308736615491},"target":{"id":4,"name":"endDevice2","label":"endDevice2","group":"Team B","runtime":40,"fixed":1,"index":3,"x":536.8588664108388,"y":287.0317688330596,"vy":0.0005545646577525152,"vx":0.004441593956377568},"type":"-->> 200","index":3},{"source":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":1,"x":599.4842735858354,"y":249.84402755850698,"vy":0.001639322539027913,"vx":0.005180308736615491},"target":{"id":5,"name":"endDevice3","label":"endDevice3","group":"Team B","runtime":40,"fixed":1,"index":4,"x":525.2988208851682,"y":230.05681557645255,"vy":0.0002951844227947501,"vx":0.0055973230220889006},"type":"-->> 130","index":4},{"source":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":1,"x":599.4842735858354,"y":249.84402755850698,"vy":0.001639322539027913,"vx":0.005180308736615491},"target":{"id":6,"name":"endDevice4","label":"endDevice4","group":"Team B","runtime":40,"fixed":1,"index":5,"x":624.1280442104007,"y":181.6792464301932,"vy":0.0019051315580896745,"vx":0.006187588136229895},"type":"-->> 124","index":5},{"source":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fixed":1,"index":0,"x":657.3499848281795,"y":316.54404939884074,"vy":0.0017350565819290436,"vx":0.004498328133147586},"target":{"id":7,"name":"router2","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":6,"x":692.7827474974492,"y":395.5542668832953,"vy":0.0017098253559865455,"vx":0.004124632984863109},"type":"-->> 255","index":6},{"source":{"id":7,"name":"router2","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":6,"x":692.7827474974492,"y":395.5542668832953,"vy":0.0017098253559865455,"vx":0.004124632984863109},"target":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fixed":1,"index":0,"x":657.3499848281795,"y":316.54404939884074,"vy":0.0017350565819290436,"vx":0.004498328133147586},"type":"-->> 255","index":7},{"source":{"id":7,"name":"router2","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":6,"x":692.7827474974492,"y":395.5542668832953,"vy":0.0017098253559865455,"vx":0.004124632984863109},"target":{"id":8,"name":"endDevice5","label":"endDevice1","group":"Team B","runtime":40,"fixed":1,"index":7,"x":668.5801315913837,"y":462.0893391361523,"vy":0.0017445523132752052,"vx":0.004099187976375954},"type":"-->> 168","index":8},{"source":{"id":7,"name":"router2","label":"router 1","group":"Team A","runtime":60,"fixed":1,"index":6,"x":692.7827474974492,"y":395.5542668832953,"vy":0.0017098253559865455,"vx":0.004124632984863109},"target":{"id":9,"name":"endDevice5","label":"endDevice2","group":"Team B","runtime":40,"fixed":1,"index":8,"x":750.3534611527298,"y":433.78106416387806,"vy":0.0012451307265845288,"vx":0.004499702460309589},"type":"-->> 200","index":9}]}`);
      return JSON.parse(`{"nodes":[{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,
      "x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},{"id":2,"name":"router1","label":"router 1","group":
      "Team A","runtime":60,"fx":592.4646482377395,"fy":185.6298366232384,"fixed":1,"index":1,"x":592.4646482377395,
      "y":185.6298366232384,"vy":0,"vx":0},{"id":3,"name":"endDevice1","label":"endDevice1","group":"Team B",
      "runtime":40,"fx":639.3021096741587,"fy":113.80536719590268,"fixed":1,"index":2,"x":639.3021096741587,
      "y":113.80536719590268,"vy":0,"vx":0},{"id":4,"name":"endDevice2","label":"endDevice2","group":"Team B",
      "runtime":40,"fx":683.6006784645841,"fy":150.7731163778075,"fixed":1,"index":3,"x":683.6006784645841,"y":150.7731163778075,
      "vy":0,"vx":0},{"id":5,"name":"endDevice3","label":"endDevice3","group":"Team B","runtime":40,"fx":526.6965899734212,
      "fy":121.3200291686734,"fixed":1,"index":4,"x":526.6965899734212,"y":121.3200291686734,"vy":0,"vx":0},{"id":6,"name":
      "endDevice4","label":"endDevice4","group":"Team B","runtime":40,"fx":674.0601077840967,"fy":101.78790696024656,
      "fixed":1,"index":5,"x":674.0601077840967,"y":101.78790696024656,"vy":0,"vx":0},{"id":7,"name":"router2",
      "label":"router 1","group":"Team A","runtime":60,"fx":414.83770654683417,"fy":209.00262452939737,"fixed":1,
      "index":6,"x":414.83770654683417,"y":209.00262452939737,"vy":0,"vx":0},{"id":8,"name":"endDevice5","label":"endDevice1","group":"Team B","runtime":40,"fx":792.4762531814808,
      "fy":275.72684308998555,"fixed":1,"index":7,"x":792.4762531814808,"y":275.72684308998555,"vy":0,"vx":0},{"id":9,"name":"endDevice5","label":"endDevice2","group":"Team B","runtime":40,
      "fx":433.30729413942953,"fy":118.0620439639461,"fixed":1,"index":8,"x":433.30729413942953,"y":118.0620439639461,"vy":0,"vx":0},
      {"id":10,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":724.6353879125816,"fy":406.4227127430629,"fixed":1,
      "index":9,"x":724.6353879125816,"y":406.4227127430629,"vy":0,"vx":0},{"id":11,"name":"endDevice6","label":"endDevice6","group":"Team B",
      "runtime":40,"fixed":1,"index":10,"x":833.9829939864393,"y":379.22094572812597,"vy":1.6668429008255703,"vx":-3.4652544575446043},
      {"id":13,"name":"endDevice7","label":"endDevice7","group":"Team B","runtime":40,"fixed":1,"index":11,"x":814.0015516038034,"y":443.12121095278235,"vy":1.6708257364773864,"vx":-3.4686554322982355},{"id":14,"name":"endDevice8","label":"endDevice8","group":"Team B","runtime":40,"fixed":1,"index":12,"x":809.2369371685882,"y":352.9519423581377,"vy":1.6748832289517177,"vx":-3.474787186663348},{"id":15,"name":"endDevice9","label":"endDevice9","group":"Team B","runtime":40,"fixed":1,"index":13,"x":842.2539657118703,"y":415.6606750580635,"vy":1.669689652293178,"vx":-3.469878019711494},{"id":16,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":449.80335413151903,"fy":394.12141098099573,"fixed":1,"index":14,"x":449.80335413151903,"y":394.12141098099573,"vy":0,"vx":0},{"id":17,"name":"endDevice6","label":"endDevice6","group":"Team B","runtime":40,"fx":435.74823019704485,"fy":317.5663663900221,"fixed":1,"index":15,"x":435.74823019704485,"y":317.5663663900221,"vy":0,"vx":0},{"id":18,"name":"endDevice7","label":"endDevice7","group":"Team B","runtime":40,"fx":676.362294047424,"fy":546.0244645343246,"fixed":1,"index":16,"x":676.362294047424,"y":546.0244645343246,"vy":0,"vx":0},{"id":19,"name":"endDevice8","label":"endDevice8","group":"Team B","runtime":40,"fx":266.21954688438416,"fy":179.79526696429093,"fixed":1,"index":17,"x":266.21954688438416,"y":179.79526696429093,"vy":0,"vx":0},{"id":20,"name":"endDevice9","label":"endDevice9","group":"Team B","runtime":40,"fx":1035.2735341510331,"fy":423.28961887354546,"fixed":1,"index":18,"x":1035.2735341510331,"y":423.28961887354546,"vy":0,"vx":0},{"id":21,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":19,"x":819.5448856960489,"y":45.73984895750153,"vy":1.6660440476025777,"vx":-3.480519986647231},{"id":22,"name":"endDevice6","label":"endDevice6","group":"Team B","runtime":40,"fixed":1,"index":20,"x":917.6713304237436,"y":29.083165726238633,"vy":1.662226193868286,"vx":-3.478738869016015},{"id":23,"name":"endDevice7","label":"endDevice7","group":"Team B","runtime":40,"fixed":1,"index":21,"x":888.5547675901958,"y":-18.815492551934394,"vy":1.6724827861349933,"vx":-3.4893046326410815},{"id":24,"name":"endDevice8","label":"endDevice8","group":"Team B","runtime":40,"fixed":1,"index":22,"x":926.0841034965059,"y":-13.284705006215702,"vy":1.6558051366909472,"vx":-3.4859193391601027},{"id":25,"name":"endDevice9","label":"endDevice9","group":"Team B","runtime":40,"fixed":1,"index":23,"x":868.9408791482341,"y":-51.25110253415258,"vy":1.66332362216556,"vx":-3.4785474259331477},{"id":26,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":341.1226018074615,"fy":442.9947319692749,"fixed":1,"index":24,"x":341.1226018074615,"y":442.9947319692749,"vy":0,"vx":0},{"id":27,"name":"endDevice6","label":"endDevice6","group":"Team B","runtime":40,"fx":288.30106770162877,"fy":392.6507309336937,"fixed":1,"index":25,"x":288.30106770162877,"y":392.6507309336937,"vy":0,"vx":0},{"id":28,"name":"endDevice7","label":"endDevice7","group":"Team B","runtime":40,"fixed":1,"index":26,"x":352.24988015689445,"y":370.80945316080295,"vy":1.6684058380851332,"vx":-3.4855864988742153},{"id":29,"name":"endDevice8","label":"endDevice8","group":"Team B","runtime":40,"fixed":1,"index":27,"x":312.3429396015783,"y":497.3081438842511,"vy":1.703614914367072,"vx":-3.420747479219582},{"id":30,"name":"endDevice9","label":"endDevice9","group":"Team B","runtime":40,"fixed":1,"index":28,"x":393.92152023201,"y":486.00832267768357,"vy":1.6367614577826752,"vx":-3.4392318657114918},{"id":31,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":29,"x":514.9774103938914,"y":535.5817367223069,"vy":1.6788119489875146,"vx":-3.4663450385352785},{"id":32,"name":"endDevice6","label":"endDevice6","group":"Team B","runtime":40,"fixed":1,"index":30,"x":536.7862324294305,"y":612.4008860553755,"vy":1.679429791906534,"vx":-3.467618861632283},{"id":33,"name":"endDevice7","label":"endDevice7","group":"Team B","runtime":40,"fixed":1,"index":31,"x":597.5769206811156,"y":562.065337254166,"vy":1.68194995231171,"vx":-3.466287203322943},{"id":34,"name":"endDevice8","label":"endDevice8","group":"Team B","runtime":40,"fixed":1,"index":32,"x":582.0929842057367,"y":601.9401054427005,"vy":1.6807774937344264,"vx":-3.467380037759652},{"id":35,"name":"endDevice9","label":"endDevice9","group":"Team B","runtime":40,"fixed":1,"index":33,"x":592.3800919499367,"y":512.3442892692534,"vy":1.6817914363919653,"vx":-3.465733883135693}],"links":[{"source":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"target":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,
      "fx":592.4646482377395,"fy":185.6298366232384,"fixed":1,"index":1,"x":592.4646482377395,"y":185.6298366232384,"vy":0,"vx":0},"type":"-->> 255","index":0},{"source":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fx":592.4646482377395,"fy":185.6298366232384,"fixed":1,"index":1,"x":592.4646482377395,"y":185.6298366232384,"vy":0,"vx":0},"target":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"type":"-->> 255","index":1},{"source":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fx":592.4646482377395,"fy":185.6298366232384,"fixed":1,"index":1,"x":592.4646482377395,"y":185.6298366232384,"vy":0,"vx":0},"target":{"id":3,"name":"endDevice1","label":"endDevice1","group":"Team B","runtime":40,"fx":639.3021096741587,"fy":113.80536719590268,"fixed":1,"index":2,"x":639.3021096741587,"y":113.80536719590268,"vy":0,"vx":0},"type":"-->> 168","index":2},{"source":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fx":592.4646482377395,"fy":185.6298366232384,"fixed":1,"index":1,"x":592.4646482377395,"y":185.6298366232384,"vy":0,"vx":0},"target":{"id":4,"name":"endDevice2","label":"endDevice2","group":"Team B","runtime":40,"fx":683.6006784645841,"fy":150.7731163778075,"fixed":1,"index":3,"x":683.6006784645841,"y":150.7731163778075,"vy":0,"vx":0},"type":"-->> 200","index":3},{"source":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fx":592.4646482377395,"fy":185.6298366232384,"fixed":1,"index":1,"x":592.4646482377395,"y":185.6298366232384,"vy":0,"vx":0},"target":{"id":5,"name":"endDevice3","label":"endDevice3","group":"Team B","runtime":40,"fx":526.6965899734212,"fy":121.3200291686734,"fixed":1,"index":4,"x":526.6965899734212,"y":121.3200291686734,"vy":0,"vx":0},"type":"-->> 130","index":4},{"source":{"id":2,"name":"router1","label":"router 1","group":"Team A","runtime":60,"fx":592.4646482377395,"fy":185.6298366232384,"fixed":1,"index":1,"x":592.4646482377395,"y":185.6298366232384,"vy":0,"vx":0},"target":{"id":6,"name":"endDevice4","label":"endDevice4","group":"Team B","runtime":40,"fx":674.0601077840967,"fy":101.78790696024656,"fixed":1,"index":5,"x":674.0601077840967,"y":101.78790696024656,"vy":0,"vx":0},"type":"-->> 124","index":5},{"source":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"target":{"id":7,"name":"router2","label":"router 1","group":"Team A","runtime":60,"fx":414.83770654683417,"fy":209.00262452939737,"fixed":1,"index":6,"x":414.83770654683417,"y":209.00262452939737,"vy":0,"vx":0},"type":"-->> 255","index":6},{"source":{"id":7,"name":"router2","label":"router 1","group":"Team A","runtime":60,"fx":414.83770654683417,"fy":209.00262452939737,"fixed":1,"index":6,"x":414.83770654683417,"y":209.00262452939737,"vy":0,"vx":0},"target":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"type":"-->> 255","index":7},{"source":{"id":7,"name":"router2","label":"router 1","group":"Team A","runtime":60,"fx":414.83770654683417,"fy":209.00262452939737,"fixed":1,"index":6,"x":414.83770654683417,"y":209.00262452939737,"vy":0,"vx":0},"target":{"id":8,"name":"endDevice5","label":"endDevice1","group":"Team B","runtime":40,"fx":792.4762531814808,"fy":275.72684308998555,"fixed":1,"index":7,"x":792.4762531814808,"y":275.72684308998555,"vy":0,"vx":0},"type":"-->> 168","index":8},{"source":{"id":7,"name":"router2","label":"router 1","group":"Team A","runtime":60,"fx":414.83770654683417,"fy":209.00262452939737,"fixed":1,"index":6,"x":414.83770654683417,"y":209.00262452939737,"vy":0,"vx":0},"target":{"id":9,"name":"endDevice5","label":"endDevice2","group":"Team B","runtime":40,"fx":433.30729413942953,"fy":118.0620439639461,"fixed":1,"index":8,"x":433.30729413942953,"y":118.0620439639461,"vy":0,"vx":0},"type":"-->> 200","index":9},{"source":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"target":{"id":10,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":724.6353879125816,"fy":406.4227127430629,"fixed":1,"index":9,"x":724.6353879125816,"y":406.4227127430629,"vy":0,"vx":0},"type":"-->> 255","index":10},{"source":{"id":10,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":724.6353879125816,"fy":406.4227127430629,"fixed":1,"index":9,"x":724.6353879125816,"y":406.4227127430629,"vy":0,"vx":0},"target":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"type":"-->> 255","index":11},{"source":{"id":10,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":724.6353879125816,"fy":406.4227127430629,"fixed":1,"index":9,"x":724.6353879125816,"y":406.4227127430629,"vy":0,"vx":0},"target":{"id":11,"name":"endDevice6","label":"endDevice6","group":"Team B","runtime":40,"fixed":1,"index":10,"x":833.9829939864393,"y":379.22094572812597,"vy":1.6668429008255703,"vx":-3.4652544575446043},"type":"-->> 255","index":12},{"source":{"id":10,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":724.6353879125816,"fy":406.4227127430629,"fixed":1,"index":9,"x":724.6353879125816,"y":406.4227127430629,"vy":0,"vx":0},"target":{"id":13,"name":"endDevice7","label":"endDevice7","group":"Team B","runtime":40,"fixed":1,"index":11,"x":814.0015516038034,"y":443.12121095278235,"vy":1.6708257364773864,"vx":-3.4686554322982355},"type":"-->> 255","index":13},{"source":{"id":10,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":724.6353879125816,"fy":406.4227127430629,"fixed":1,"index":9,"x":724.6353879125816,"y":406.4227127430629,"vy":0,"vx":0},"target":{"id":14,"name":"endDevice8","label":"endDevice8","group":"Team B","runtime":40,"fixed":1,"index":12,"x":809.2369371685882,"y":352.9519423581377,"vy":1.6748832289517177,"vx":-3.474787186663348},"type":"-->> 255","index":14},{"source":{"id":10,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":724.6353879125816,"fy":406.4227127430629,"fixed":1,"index":9,"x":724.6353879125816,"y":406.4227127430629,"vy":0,"vx":0},"target":{"id":15,"name":"endDevice9","label":"endDevice9","group":"Team B","runtime":40,"fixed":1,"index":13,"x":842.2539657118703,"y":415.6606750580635,"vy":1.669689652293178,"vx":-3.469878019711494},"type":"-->> 255","index":15},{"source":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"target":{"id":16,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":449.80335413151903,"fy":394.12141098099573,"fixed":1,"index":14,"x":449.80335413151903,"y":394.12141098099573,"vy":0,"vx":0},"type":"-->> 255","index":16},{"source":{"id":16,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":449.80335413151903,"fy":394.12141098099573,"fixed":1,"index":14,"x":449.80335413151903,"y":394.12141098099573,"vy":0,"vx":0},"target":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"type":"-->> 255","index":17},{"source":{"id":16,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":449.80335413151903,"fy":394.12141098099573,"fixed":1,"index":14,"x":449.80335413151903,"y":394.12141098099573,"vy":0,"vx":0},"target":{"id":17,"name":"endDevice6","label":"endDevice6","group":"Team B","runtime":40,"fx":435.74823019704485,"fy":317.5663663900221,"fixed":1,"index":15,"x":435.74823019704485,"y":317.5663663900221,"vy":0,"vx":0},"type":"-->> 255","index":18},{"source":{"id":16,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":449.80335413151903,"fy":394.12141098099573,"fixed":1,"index":14,"x":449.80335413151903,"y":394.12141098099573,"vy":0,"vx":0},"target":{"id":18,"name":"endDevice7","label":"endDevice7","group":"Team B","runtime":40,"fx":676.362294047424,"fy":546.0244645343246,"fixed":1,"index":16,"x":676.362294047424,"y":546.0244645343246,"vy":0,"vx":0},"type":"-->> 255","index":19},{"source":{"id":16,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":449.80335413151903,"fy":394.12141098099573,"fixed":1,"index":14,"x":449.80335413151903,"y":394.12141098099573,"vy":0,"vx":0},"target":{"id":19,"name":"endDevice8","label":"endDevice8","group":"Team B","runtime":40,"fx":266.21954688438416,"fy":179.79526696429093,"fixed":1,"index":17,"x":266.21954688438416,"y":179.79526696429093,"vy":0,"vx":0},"type":"-->> 255","index":20},{"source":{"id":16,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":449.80335413151903,"fy":394.12141098099573,"fixed":1,"index":14,"x":449.80335413151903,"y":394.12141098099573,"vy":0,"vx":0},"target":{"id":20,"name":"endDevice9","label":"endDevice9","group":"Team B","runtime":40,"fx":1035.2735341510331,"fy":423.28961887354546,"fixed":1,"index":18,"x":1035.2735341510331,
      "y":423.28961887354546,"vy":0,"vx":0},"type":"-->> 255","index":21},{"source":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"target":{"id":21,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":19,"x":819.5448856960489,"y":45.73984895750153,"vy":1.6660440476025777,"vx":-3.480519986647231},"type":"-->> 255","index":22},{"source":{"id":21,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":19,"x":819.5448856960489,"y":45.73984895750153,"vy":1.6660440476025777,"vx":-3.480519986647231},"target":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"type":"-->> 255","index":23},{"source":{"id":21,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":19,"x":819.5448856960489,"y":45.73984895750153,"vy":1.6660440476025777,"vx":-3.480519986647231},"target":{"id":22,"name":"endDevice6","label":"endDevice6","group":"Team B","runtime":40,"fixed":1,"index":20,"x":917.6713304237436,"y":29.083165726238633,"vy":1.662226193868286,"vx":-3.478738869016015},"type":"-->> 255","index":24},{"source":{"id":21,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":19,"x":819.5448856960489,"y":45.73984895750153,"vy":1.6660440476025777,"vx":-3.480519986647231},"target":{"id":23,"name":"endDevice7","label":"endDevice7","group":"Team B","runtime":40,"fixed":1,"index":21,"x":888.5547675901958,"y":-18.815492551934394,"vy":1.6724827861349933,"vx":-3.4893046326410815},"type":"-->> 255","index":25},{"source":{"id":21,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":19,"x":819.5448856960489,"y":45.73984895750153,"vy":1.6660440476025777,"vx":-3.480519986647231},"target":{"id":24,"name":"endDevice8","label":"endDevice8","group":"Team B","runtime":40,"fixed":1,"index":22,"x":926.0841034965059,"y":-13.284705006215702,"vy":1.6558051366909472,"vx":-3.4859193391601027},"type":"-->> 255","index":26},{"source":{"id":21,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":19,"x":819.5448856960489,"y":45.73984895750153,"vy":1.6660440476025777,"vx":-3.480519986647231},"target":{"id":25,"name":"endDevice9","label":"endDevice9","group":"Team B","runtime":40,"fixed":1,"index":23,"x":868.9408791482341,"y":-51.25110253415258,"vy":1.66332362216556,"vx":-3.4785474259331477},"type":"-->> 255","index":27},{"source":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"target":{"id":26,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":341.1226018074615,"fy":442.9947319692749,"fixed":1,"index":24,"x":341.1226018074615,"y":442.9947319692749,"vy":0,"vx":0},"type":"-->> 255","index":28},{"source":{"id":26,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":341.1226018074615,"fy":442.9947319692749,"fixed":1,"index":24,"x":341.1226018074615,"y":442.9947319692749,"vy":0,"vx":0},"target":{"id":1,"name":"coordinator","label":"coordinator","group":"Team C","runtime":20,"fx":521.2455839675663,"fy":270.81990729422154,"fixed":1,"index":0,"x":521.2455839675663,"y":270.81990729422154,"vy":0,"vx":0},"type":"-->> 255","index":29},{"source":{"id":26,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":341.1226018074615,"fy":442.9947319692749,"fixed":1,"index":24,"x":341.1226018074615,"y":442.9947319692749,"vy":0,"vx":0},"target":{"id":27,"name":"endDevice6","label":"endDevice6","group":"Team B","runtime":40,"fx":288.30106770162877,"fy":392.6507309336937,"fixed":1,"index":25,"x":288.30106770162877,"y":392.6507309336937,"vy":0,"vx":0},"type":"-->> 255","index":30},{"source":{"id":26,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":341.1226018074615,"fy":442.9947319692749,"fixed":1,"index":24,"x":341.1226018074615,"y":442.9947319692749,"vy":0,"vx":0},"target":{"id":28,"name":"endDevice7","label":"endDevice7","group":"Team B","runtime":40,"fixed":1,"index":26,"x":352.24988015689445,"y":370.80945316080295,"vy":1.6684058380851332,"vx":-3.4855864988742153},"type":"-->> 255","index":31},{"source":{"id":26,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":341.1226018074615,"fy":442.9947319692749,"fixed":1,"index":24,"x":341.1226018074615,"y":442.9947319692749,"vy":0,"vx":0},"target":{"id":29,"name":"endDevice8","label":"endDevice8","group":"Team B","runtime":40,"fixed":1,"index":27,"x":312.3429396015783,"y":497.3081438842511,"vy":1.703614914367072,"vx":-3.420747479219582},"type":"-->> 255","index":32},{"source":{"id":26,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":341.1226018074615,"fy":442.9947319692749,"fixed":1,"index":24,"x":341.1226018074615,"y":442.9947319692749,"vy":0,"vx":0},"target":{"id":30,"name":"endDevice9","label":"endDevice9","group":"Team B","runtime":40,"fixed":1,"index":28,"x":393.92152023201,"y":486.00832267768357,"vy":1.6367614577826752,"vx":-3.4392318657114918},"type":"-->> 255","index":33},{"source":{"id":26,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":341.1226018074615,"fy":442.9947319692749,"fixed":1,"index":24,"x":341.1226018074615,"y":442.9947319692749,"vy":0,"vx":0},"target":{"id":31,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":29,"x":514.9774103938914,"y":535.5817367223069,"vy":1.6788119489875146,"vx":-3.4663450385352785},"type":"-->> 255","index":34},{"source":{"id":31,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":29,"x":514.9774103938914,"y":535.5817367223069,"vy":1.6788119489875146,"vx":-3.4663450385352785},"target":{"id":26,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fx":341.1226018074615,"fy":442.9947319692749,"fixed":1,"index":24,"x":341.1226018074615,"y":442.9947319692749,"vy":0,"vx":0},"type":"-->> 255","index":35},{"source":{"id":31,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":29,"x":514.9774103938914,"y":535.5817367223069,"vy":1.6788119489875146,"vx":-3.4663450385352785},"target":{"id":32,"name":"endDevice6","label":"endDevice6","group":"Team B","runtime":40,"fixed":1,"index":30,"x":536.7862324294305,"y":612.4008860553755,"vy":1.679429791906534,"vx":-3.467618861632283},"type":"-->> 255","index":36},{"source":{"id":31,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":29,"x":514.9774103938914,"y":535.5817367223069,"vy":1.6788119489875146,"vx":-3.4663450385352785},"target":{"id":33,"name":"endDevice7","label":"endDevice7","group":"Team B","runtime":40,"fixed":1,"index":31,"x":597.5769206811156,"y":562.065337254166,"vy":1.68194995231171,"vx":-3.466287203322943},"type":"-->> 255","index":37},{"source":{"id":31,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":29,"x":514.9774103938914,"y":535.5817367223069,"vy":1.6788119489875146,"vx":-3.4663450385352785},"target":{"id":34,"name":"endDevice8","label":"endDevice8","group":"Team B","runtime":40,"fixed":1,"index":32,"x":582.0929842057367,"y":601.9401054427005,"vy":1.6807774937344264,"vx":-3.467380037759652},"type":"-->> 255","index":38},{"source":{"id":31,"name":"router3","label":"router 3","group":"Team A","runtime":60,"fixed":1,"index":29,"x":514.9774103938914,"y":535.5817367223069,"vy":1.6788119489875146,"vx":-3.4663450385352785},"target":{"id":35,"name":"endDevice9","label":"endDevice9","group":"Team B","runtime":40,"fixed":1,"index":33,"x":592.3800919499367,"y":512.3442892692534,"vy":1.6817914363919653,"vx":-3.465733883135693},"type":"-->> 255","index":39}]}`)
    } else if (type === 1) {
      return {
        nodes: [
          { id: 1, name: 'C', label: 'coordinator', group: 'Team C', runtime: 20 },
          { id: 2, name: 'R1', label: 'router 1', group: 'Team A', runtime: 60 },
          { id: 3, name: 'endDevice1', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 4, name: 'endDevice2', label: 'endDevice2', group: 'Team B', runtime: 40 },
          { id: 5, name: 'endDevice3', label: 'endDevice3', group: 'Team B', runtime: 40 },
          { id: 6, name: 'endDevice4', label: 'endDevice4', group: 'Team B', runtime: 40 },

          { id: 7, name: 'R2', label: 'router 1', group: 'Team A', runtime: 60 },
          { id: 8, name: 'endDevice5', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 9, name: 'endDevice5', label: 'endDevice2', group: 'Team B', runtime: 40 },
        ],
        links: [
          { source: 1, target: 2, type: '-->> 255' },
          { source: 2, target: 1, type: '-->> 255' },
          { source: 2, target: 3, type: '-->> 168' },
          { source: 2, target: 4, type: '-->> 200' },
          { source: 2, target: 5, type: '-->> 130' },
          { source: 2, target: 6, type: '-->> 124' },

          { source: 1, target: 7, type: '-->> 255' },
          { source: 7, target: 1, type: '-->> 255' },
          { source: 7, target: 8, type: '-->> 168' },
          { source: 7, target: 9, type: '-->> 200' }
        ]
      };
    } else if (type === 2) {
      return {
        nodes: [
          { id: 0, name: 'B', label: 'B', group: 'Team D', runtime: 100 },
          { id: 1, name: 'C', label: 'C', group: 'Team C', runtime: 100 },
          { id: 2, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 3, name: 'endDevice1', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 4, name: 'endDevice2', label: 'endDevice2', group: 'Team B', runtime: 40 },
          { id: 5, name: 'endDevice3', label: 'endDevice3', group: 'Team B', runtime: 40 },
          { id: 6, name: 'endDevice4', label: 'endDevice4', group: 'Team B', runtime: 40 },

          { id: 7, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 8, name: 'endDevice5', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 9, name: 'endDevice5', label: 'endDevice2', group: 'Team B', runtime: 40 },

          { id: 10, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 11, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 13, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 14, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 15, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 16, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 17, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 18, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 19, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 20, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 21, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 22, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 23, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 24, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 25, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 26, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 27, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 28, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 29, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 30, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 31, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
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
          { source: 0, target: 1, type: '-->> 255', data: { strength: 255 } },
          { source: 1, target: 0, type: '-->> 255', data: { strength: 255 } },
          { source: 1, target: 2, type: '-->> 255', data: { strength: 255 } },
          { source: 2, target: 1, type: '-->> 255', data: { strength: 255 } },
          { source: 2, target: 3, type: '-->> 168', data: { strength: 255 } },
          { source: 2, target: 4, type: '-->> 200', data: { strength: 255 } },
          { source: 2, target: 5, type: '-->> 130', data: { strength: 255 } },
          { source: 2, target: 6, type: '-->> 124', data: { strength: 255 } },

          { source: 1, target: 7, type: '-->> 255', data: { strength: 255 } },
          { source: 7, target: 1, type: '-->> 255', data: { strength: 255 } },
          { source: 7, target: 8, type: '-->> 168', data: { strength: 255 } },
          { source: 7, target: 9, type: '-->> 200', data: { strength: 255 } },

          { source: 1, target: 10, type: '-->> 255', data: { strength: 255 } },
          { source: 10, target: 1, type: '-->> 255', data: { strength: 255 } },
          { source: 10, target: 11, type: '-->> 255', data: { strength: 255 } },
          { source: 10, target: 13, type: '-->> 255', data: { strength: 255 } },
          { source: 10, target: 14, type: '-->> 255', data: { strength: 255 } },
          { source: 10, target: 15, type: '-->> 255', data: { strength: 255 } },

          { source: 1, target: 16, type: '-->> 255', data: { strength: 255 } },
          { source: 16, target: 1, type: '-->> 255', data: { strength: 255 } },
          { source: 16, target: 17, type: '-->> 255', data: { strength: 255 } },
          { source: 16, target: 18, type: '-->> 255', data: { strength: 255 } },
          { source: 16, target: 19, type: '-->> 255', data: { strength: 255 } },
          { source: 16, target: 20, type: '-->> 255', data: { strength: 255 } },


          { source: 1, target: 21, type: '-->> 255', data: { strength: 255 } },
          { source: 21, target: 1, type: '-->> 255', data: { strength: 255 } },
          { source: 21, target: 22, type: '-->> 255', data: { strength: 255 } },
          { source: 21, target: 23, type: '-->> 255', data: { strength: 255 } },
          { source: 21, target: 24, type: '-->> 255', data: { strength: 255 } },
          { source: 21, target: 25, type: '-->> 255', data: { strength: 255 } },

          { source: 1, target: 26, type: '-->> 255', data: { strength: 255 } },
          { source: 26, target: 1, type: '-->> 255', data: { strength: 255 } },
          { source: 26, target: 27, type: '-->> 255', data: { strength: 255 } },
          { source: 26, target: 28, type: '-->> 255', data: { strength: 255 } },
          { source: 26, target: 29, type: '-->> 255', data: { strength: 255 } },
          { source: 26, target: 30, type: '-->> 255', data: { strength: 255 } },

          { source: 26, target: 31, type: '-->> 255', data: { strength: 255 } },
          { source: 31, target: 26, type: '-->> 255', data: { strength: -255 } },
          { source: 31, target: 32, type: '-->> 255', data: { strength: 255 } },
          { source: 31, target: 33, type: '-->> 255', data: { strength: 255 } },
          { source: 31, target: 34, type: '-->> 255', data: { strength: 255 } },
          { source: 31, target: 35, type: '-->> 255', data: { strength: 255 } },

          // { source: 31, target: 36, type: '-->> 255' },
          // { source: 36, target: 31, type: '-->> 255' },
          // { source: 36, target: 37, type: '-->> 255' },
          // { source: 36, target: 38, type: '-->> 255' },
          // { source: 36, target: 39, type: '-->> 255' },
          // { source: 36, target: 40, type: '-->> 255' },

        ]
      };
    } else if (type === 3) {
      return {
        nodes: [
          { id: 1, name: 'C', label: 'C', group: 'Team C', runtime: 100 },
          { id: 2, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 3, name: 'endDevice1', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 4, name: 'endDevice2', label: 'endDevice2', group: 'Team B', runtime: 40 },
          { id: 5, name: 'endDevice3', label: 'endDevice3', group: 'Team B', runtime: 40 },
          { id: 6, name: 'endDevice4', label: 'endDevice4', group: 'Team B', runtime: 40 },

          { id: 7, name: 'R1', label: 'R2', group: 'Team A', runtime: 80 },
          { id: 8, name: 'endDevice5', label: 'endDevice1', group: 'Team B', runtime: 40 },
          { id: 9, name: 'endDevice5', label: 'endDevice2', group: 'Team B', runtime: 40 },

          { id: 10, name: 'R1', label: 'R3', group: 'Team A', runtime: 80 },
          { id: 11, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 13, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 14, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 15, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 16, name: 'R1', label: 'R4', group: 'Team A', runtime: 80 },
          { id: 17, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 18, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 19, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 20, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 21, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 22, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 23, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 24, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 25, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 26, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 27, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 28, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 29, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 30, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 31, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 32, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 33, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 34, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 35, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },

          { id: 36, name: 'R1', label: 'R1', group: 'Team A', runtime: 80 },
          { id: 37, name: 'endDevice6', label: 'endDevice6', group: 'Team B', runtime: 40 },
          { id: 38, name: 'endDevice7', label: 'endDevice7', group: 'Team B', runtime: 40 },
          { id: 39, name: 'endDevice8', label: 'endDevice8', group: 'Team B', runtime: 40 },
          { id: 40, name: 'endDevice9', label: 'endDevice9', group: 'Team B', runtime: 40 },
        ],
        links: [
          { source: 1, target: 2, type: '-->> 255' },
          { source: 2, target: 1, type: '-->> 255' },
          { source: 2, target: 3, type: '-->> 168' },
          { source: 2, target: 4, type: '-->> 200' },
          { source: 2, target: 5, type: '-->> 130' },
          { source: 2, target: 6, type: '-->> 124' },

          { source: 1, target: 7, type: '-->> 255' },
          { source: 7, target: 1, type: '-->> 255' },
          { source: 7, target: 8, type: '-->> 168' },
          { source: 7, target: 9, type: '-->> 200' },

          { source: 1, target: 10, type: '-->> 255' },
          { source: 10, target: 1, type: '-->> 255' },
          { source: 10, target: 11, type: '-->> 255' },
          { source: 10, target: 13, type: '-->> 255' },
          { source: 10, target: 14, type: '-->> 255' },
          { source: 10, target: 15, type: '-->> 255' },

          { source: 1, target: 16, type: '-->> 255' },
          { source: 16, target: 1, type: '-->> 255' },
          { source: 16, target: 17, type: '-->> 255' },
          { source: 16, target: 18, type: '-->> 255' },
          { source: 16, target: 19, type: '-->> 255' },
          { source: 16, target: 20, type: '-->> 255' },


          { source: 1, target: 21, type: '-->> 255' },
          { source: 21, target: 1, type: '-->> 255' },
          { source: 21, target: 22, type: '-->> 255' },
          { source: 21, target: 23, type: '-->> 255' },
          { source: 21, target: 24, type: '-->> 255' },
          { source: 21, target: 25, type: '-->> 255' },

          { source: 1, target: 26, type: '-->> 255' },
          { source: 26, target: 1, type: '-->> 255' },
          { source: 26, target: 27, type: '-->> 255' },
          { source: 26, target: 28, type: '-->> 255' },
          { source: 26, target: 29, type: '-->> 255' },
          { source: 26, target: 30, type: '-->> 255' },

          { source: 26, target: 31, type: '-->> 255' },
          { source: 31, target: 26, type: '-->> 255' },
          { source: 31, target: 32, type: '-->> 255' },
          { source: 31, target: 33, type: '-->> 255' },
          { source: 31, target: 34, type: '-->> 255' },
          { source: 31, target: 35, type: '-->> 255' },

          { source: 31, target: 36, type: '-->> 255' },
          { source: 36, target: 31, type: '-->> 255' },
          { source: 36, target: 37, type: '-->> 255' },
          { source: 36, target: 38, type: '-->> 255' },
          { source: 36, target: 39, type: '-->> 255' },
          { source: 36, target: 40, type: '-->> 255' },

        ]
      };
    }

  }

  public initSvg() {
    this.width = 65; //45 for desktop
    this.height = 63;

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
        .attr('viewBox', '-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
        .attr('refX', 23) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('xoverflow', 'visible')
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
      .range(['#fff178', '#abe5ff', '#d5bbff', '#e1d4db', '#9e79db']) as any;
  }

}